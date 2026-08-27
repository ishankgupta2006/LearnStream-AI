const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Run the transcript python script trying a few common command names,
 * since 'python3' is not always registered on Windows (it's often just
 * 'python', or the 'py' launcher).
 */
function runPythonScript(scriptPath, videoId, commands) {
  return new Promise((resolve) => {
    const tryCommand = (index) => {
      if (index >= commands.length) {
        console.log('Could not find a working Python interpreter (tried: ' + commands.join(', ') + ')');
        resolve(null);
        return;
      }

      const cmd = commands[index];
      const python = spawn(cmd, [scriptPath, videoId]);

      let stdout = '';
      let stderr = '';
      let settled = false;

      const finish = (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutHandle);
        resolve(value);
      };

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.log(`Python script (${cmd}) stderr:`, stderr);
          finish(null);
          return;
        }

        try {
          const result = JSON.parse(stdout);

          if (result.success && result.text) {
            console.log(`✓ Got YouTube captions: ${result.text.length} chars from ${result.segments} segments`);
            finish({
              text: result.text,
              source: 'youtube-captions',
              chapters: [],
              highlights: []
            });
          } else {
            console.log('Transcript fetch failed:', result.error);
            finish(null);
          }
        } catch (parseErr) {
          console.log('Failed to parse Python output:', parseErr.message);
          finish(null);
        }
      });

      python.on('error', (err) => {
        if (err.code === 'ENOENT') {
          // This command isn't installed/on PATH - silently try the next one.
          console.log(`'${cmd}' not found, trying next Python command...`);
          clearTimeout(timeoutHandle);
          settled = true;
          tryCommand(index + 1);
          return;
        }
        console.log(`Failed to run Python script (${cmd}):`, err.message);
        finish(null);
      });

      // Timeout after 30 seconds per attempt
      const timeoutHandle = setTimeout(() => {
        python.kill();
        finish(null);
      }, 30000);
    };

    tryCommand(0);
  });
}

/**
 * Get YouTube transcript using Python youtube-transcript-api
 */
async function getYouTubeTranscript(videoId) {
  const scriptPath = path.join(__dirname, 'scripts', 'get_transcript.py');

  console.log(`Fetching transcript for video: ${videoId} using Python script`);

  // Try common Python command names in order. 'python3' works on most
  // Linux/Mac setups; Windows installs commonly only register 'python' or
  // the 'py' launcher.
  return runPythonScript(scriptPath, videoId, ['python3', 'python', 'py']);
}

/**
 * Transcribe audio from YouTube video URL
 * Uses Python youtube-transcript-api for reliable caption extraction
 */
async function transcribeYouTubeVideo(youtubeUrl, onProgress = null) {
  const videoId = extractVideoId(youtubeUrl);
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }
  
  // Try YouTube captions using Python library
  console.log('Attempting to get YouTube captions...');
  const transcript = await getYouTubeTranscript(videoId);
  
  if (transcript && transcript.text && transcript.text.length > 100) {
    return transcript;
  }
  
  console.log('No captions available, generating content from video metadata...');
  
  // Fallback to video description
  try {
    const ytApiKey = process.env.YOUTUBE_API_KEY;
    if (ytApiKey) {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            part: 'snippet,contentDetails',
            id: videoId,
            key: ytApiKey
          }
        }
      );
      
      const video = response.data.items?.[0];
      if (video) {
        const description = video.snippet?.description || '';
        const title = video.snippet?.title || '';
        const tags = video.snippet?.tags?.join(', ') || '';
        
        // Create a context from metadata
        const metadataText = `
          Video Title: ${title}
          
          Video Description: ${description}
          
          Topics: ${tags}
          
          This is an educational video about ${title}. Please generate educational content based on the title and description.
        `.trim();
        
        if (metadataText.length > 200) {
          console.log(`Using video metadata as fallback: ${metadataText.length} chars`);
          return {
            text: metadataText,
            source: 'youtube-metadata',
            chapters: [],
            highlights: []
          };
        }
      }
    }
  } catch (err) {
    console.log('Failed to get video metadata:', err.message);
  }
  
  throw new Error('This video does not have captions/subtitles available. Please try a video with captions enabled.');
}

/**
 * Get transcription from chapters (if available)
 */
function getChapterSummaries(chapters) {
  if (!chapters || chapters.length === 0) return [];
  
  return chapters.map(chapter => ({
    headline: chapter.headline,
    summary: chapter.summary,
    start: chapter.start,
    end: chapter.end
  }));
}

module.exports = {
  transcribeYouTubeVideo,
  getChapterSummaries
};