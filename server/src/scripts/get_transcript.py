#!/usr/bin/env python3
"""
Script to fetch YouTube video transcripts.
Called by Node.js transcription service.
"""

import sys
import json

def get_transcript(video_id):
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id)
        
        # Convert to list of text
        segments = list(transcript)
        text = ' '.join([seg.text for seg in segments])
        
        return {
            'success': True,
            'text': text,
            'segments': len(segments),
            'source': 'youtube-captions'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No video ID provided'}))
        sys.exit(1)
    
    video_id = sys.argv[1]
    result = get_transcript(video_id)
    print(json.dumps(result))
