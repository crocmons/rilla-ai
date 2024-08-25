import os
import time
import speech_recognition as sr
from groq import Groq
from dotenv import load_dotenv
from flask import Flask, jsonify, request
import threading
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")
client = Groq()

# Initialize the speech recognition
recognizer = sr.Recognizer()
microphone = sr.Microphone()

# Global variables to store transcriptions and manage streaming
transcriptions = []
is_listening = False

def recognize_audio():
    global is_listening
    print("Listening... Press Ctrl+C to stop.")
    while is_listening:
        try:
            with microphone as source:
                recognizer.adjust_for_ambient_noise(source)
                print("Say something...")
                audio = recognizer.record(source, duration=10)

            # Save the audio to a file
            filename = f"audio/audio_{time.time()}.m4a"
            with open(filename, "wb") as f:
                f.write(audio.get_wav_data())

            # Send the audio to Groq for transcription
            with open(filename, "rb") as file:
                transcription = client.audio.transcriptions.create(
                    file=(filename, file.read()),
                    model="whisper-large-v3",
                    response_format="verbose_json",
                )
                
                # Filter out unwanted transcriptions (e.g., "Thank you" messages)
                if transcription.text.strip() and "thank" not in transcription.text.lower():
                    print("Transcription:", transcription.text)
                    transcriptions.append(transcription.text)

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

if __name__ == '__main__':
    app.run(debug=True)
