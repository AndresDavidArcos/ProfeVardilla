from rest_framework.decorators import api_view
from rest_framework.response import Response
import requests
import os

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

@api_view(['POST'])
def transcribe_audio(request):
    try:
        config = request.data.get('config', {})
        audio = request.data.get('audio', {})
        
        request_body = {
            'config': config,
            'audio': audio,
        }

        url = f'https://speech.googleapis.com/v1/speech:recognize?key={GOOGLE_API_KEY}'
        response = requests.post(url, json=request_body)
        response.raise_for_status()

        data = response.json()
        results = data.get('results', [])

        if results:
            transcript = results[0]['alternatives'][0]['transcript']
            return Response({'transcript': transcript})
        else:
            return Response({'error': 'No transcription results.'}, status=400)

    except requests.exceptions.HTTPError as e:
        return Response({'error': f'Google API error: {e.response.text}'}, status=e.response.status_code)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
