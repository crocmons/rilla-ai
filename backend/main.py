import os
import time
import speech_recognition as sr
from groq import Groq
from dotenv import load_dotenv
from flask import Flask, jsonify, request
import threading
from flask_cors import CORS
import boto3
from botocore.exceptions import NoCredentialsError
import uuid

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")
client = Groq()

# AWS S3 configuration
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY_ID")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# Initialize S3 client
s3 = boto3.client('s3', aws_access_key_id=AWS_ACCESS_KEY,
                  aws_secret_access_key=AWS_SECRET_KEY)

# Initialize the speech recognition
recognizer = sr.Recognizer()
microphone = sr.Microphone()

# Global variables to store transcriptions and manage streaming
transcriptions = []
conversation_texts = []
is_listening = False

def upload_to_s3(file_name, bucket, object_name=None):
    """Upload a file to an S3 bucket"""
    if object_name is None:
        object_name = file_name

    try:
        s3.upload_file(file_name, bucket, object_name)
        print(f"File {file_name} uploaded to {bucket}/{object_name}")
    except NoCredentialsError:
        print("Credentials not available")
        return None

    return f"https://{bucket}.s3.amazonaws.com/{object_name}"

def recognize_audio():
    global is_listening
    print("Listening... Press Ctrl+C to stop.")
    while is_listening:
        try:
            with microphone as source:
                recognizer.adjust_for_ambient_noise(source)
                print("Say something...")
                audio = recognizer.record(source, duration=6)

            # Create a unique filename using UUID and timestamp
            filename = f"audio_{uuid.uuid4()}_{int(time.time())}.m4a"
            with open(filename, "wb") as f:
                f.write(audio.get_wav_data())

            # Upload the file to S3 with the dynamic filename
            s3_url = upload_to_s3(filename, S3_BUCKET_NAME, object_name=filename)

            if not s3_url:
                continue

            # Transcription using the Groq API
            with open(filename, "rb") as file:
                transcription_response = client.audio.transcriptions.create(
                    file=(filename, file.read()),
                    model="whisper-large-v3",
                    response_format="verbose_json",
                )

                # Add the new transcription to the conversation history
                if transcription_response.text.strip() and "thank" not in transcription_response.text.lower():
                    print("Transcription:", transcription_response.text)
                    conversation_texts.append(transcription_response.text)
                    transcriptions.append({
                        "text": transcription_response.text,
                        "audio_url": s3_url
                    })

            # Optionally, delete the local file after upload
            os.remove(filename)

            time.sleep(2)  # Small delay to allow processing

        except Exception as e:
            print(f"Error: {e}")
            continue

@app.route('/startListening', methods=['GET'])
def startListening():
    global is_listening
    is_listening = True
    threading.Thread(target=recognize_audio).start()
    return 'Listening...'

@app.route('/stopListening', methods=['GET'])
def stopListening():
    global is_listening
    is_listening = False
    return 'Stopped listening.'

@app.route('/transcriptions', methods=['GET'])
def get_transcriptions():
    return jsonify(transcriptions)

@app.route('/conversation-summary', methods=['GET'])
def get_conversation_summary():
    conversation_text = ' '.join(conversation_texts)
    
    # Create a system prompt for summarization
    prompt = (
        f"Generate a detailed summary of the following conversation text:\n\n"
        f"{conversation_text}\n\n"
        "Provide a concise summary that captures the main points of the conversation."
    )
    
    # Generate the summary using Groq's text generation
    response = client.chat.completions.create(
        model="llama3-8b-8192",  
        messages=[
            {"role": "system", "content": "You are an expert summarizer."},
            {"role": "user", "content": prompt}
        ]
    )
    
    summary = response.choices[0].message.content.strip()
    return jsonify({
        "summary": summary
    })

if __name__ == '__main__':
    app.run(debug=True)
