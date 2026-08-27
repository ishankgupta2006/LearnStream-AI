const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Extract video ID from various YouTube URL formats
 */
function extractVideoId(url) {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Parse ISO 8601 duration to seconds
 * Example: PT1H30M45S -> 5445
 */
function parseDuration(duration) {
  if (!duration) return 0;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch video metadata from YouTube Data API v3
 */
async function getVideoMetadata(videoUrl) {
  const videoId = extractVideoId(videoUrl);
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }
  
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }
  
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'snippet,contentDetails,statistics',
        id: videoId,
        key: YOUTUBE_API_KEY
      }
    });
    
    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Video not found or is private');
    }
    
    const video = response.data.items[0];
    const duration = parseDuration(video.contentDetails.duration);
    
    // Get best available thumbnail
    const thumbnails = video.snippet.thumbnails;
    const thumbnail = thumbnails.maxres?.url || 
                      thumbnails.high?.url ||
                      thumbnails.medium?.url ||
                      thumbnails.default?.url;
    
    return {
      videoId,
      title: video.snippet.title,
      description: video.snippet.description,
      channelName: video.snippet.channelTitle,
      thumbnail,
      duration,
      publishedAt: video.snippet.publishedAt,
      viewCount: parseInt(video.statistics.viewCount || 0),
      likeCount: parseInt(video.statistics.likeCount || 0)
    };
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('YouTube API quota exceeded. Please try again later.');
    }
    if (error.response?.status === 404) {
      throw new Error('Video not found');
    }
    throw error;
  }
}

module.exports = {
  extractVideoId,
  getVideoMetadata,
  parseDuration
};
