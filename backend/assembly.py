import assemblyai as aai

aai.settings.api_key = "00cfcc3db58041d0853276b1282c577c"

def on_open(session_opened: aai.RealtimeSessionOpened):
    print(f"Session opened: {session_opened.session_id}")

def on_error(error:aai.RealtimeError):
    print(f"Error: {error}")

def on_close():
    print("Session closed")

def on_data(transcript:aai.RealtimeTranscript):
    if not transcript.text:
        return
    if isinstance(transcript, aai.RealtimeFinalTranscript):
        print(transcript.text, end="\r\n")
    else:
        print(transcript.text, end="\r")

transcriber = aai.RealtimeTranscriber(
    on_data=on_data,
    on_open=on_open,
    on_close=on_close,
    on_error=on_error,
    sample_rate=16_000
)     

transcriber.connect()

microphone_stream = aai.extras.MicrophoneStream(sample_rate=16_000)

# config = aai.TranscriptionConfig(speaker_labels=True)

# transcriber = aai.Transcriber()

# transcript = transcriber.transcribe(
#   microphone_stream,
#   config=config
# )

# for utterance in transcript.utterances:
#   print(f"Speaker {utterance.speaker}: {utterance.text}")


transcriber.close()