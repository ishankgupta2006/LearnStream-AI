const { getVideoMetadata } = require('./youtubeService');
const { transcribeYouTubeVideo } = require('./transcriptionService');
const { generateSummary, extractKeyPoints, generateQuiz } = require('./aiService');
const ProcessingJob = require('../models/ProcessingJob');
const Video = require('../models/Video');
const User = require('../models/User');

/**
 * Update job progress in database
 */
async function updateJobProgress(jobId, progress, step, status = 'processing') {
  const stepOrder = ['fetching', 'transcribing'];
  
  const steps = stepOrder.map(s => ({
    name: s,
    status: stepOrder.indexOf(s) < stepOrder.indexOf(step) ? 'completed' :
            s === step ? 'in-progress' : 'pending'
  }));
  
  await ProcessingJob.findByIdAndUpdate(jobId, {
    progress,
    currentStep: step,
    status,
    steps,
    ...(progress === 5 ? { startedAt: new Date() } : {})
  });
  
  console.log(`[Job ${jobId}] Progress: ${progress}% - ${step}`);
}

/**
 * Main video processing pipeline.
 *
 * This ONLY fetches the video's metadata and transcript, then saves the
 * video right away - it does NOT generate the AI summary, key points, or
 * quiz. Those are generated on-demand later (see generate-summary,
 * generate-keypoints, generate-quiz routes) when the learner actually asks
 * for them, so adding a video is fast and doesn't make the user wait
 * through 3 separate AI calls before they can even see the video.
 */
async function processVideo(
  jobId,
  videoUrl,
  userId,
  folderId = null,
  displayTitle = null
) {
  try {
    console.log(`\n========================================`);
    console.log(`Starting video processing: ${jobId}`);
    console.log(`URL: ${videoUrl}`);
    console.log(`========================================\n`);
    
    // ═══════════════════════════════════════════════════════════
    // STEP 1: Fetch Video Metadata (5%)
    // ═══════════════════════════════════════════════════════════
    await updateJobProgress(jobId, 5, 'fetching');
    
    let metadata;
    try {
      metadata = await getVideoMetadata(videoUrl);
      console.log(`✓ Fetched metadata: ${metadata.title}`);
    } catch (error) {
      throw new Error(`Failed to fetch video: ${error.message}`);
    }
    
    // Update job with video title
    await ProcessingJob.findByIdAndUpdate(jobId, {
      videoTitle: metadata.title
    });
    
    await updateJobProgress(jobId, 30, 'fetching');
    
    // ═══════════════════════════════════════════════════════════
    // STEP 2: Transcribe Video (40-90%)
    // ═══════════════════════════════════════════════════════════
    await updateJobProgress(jobId, 40, 'transcribing');
    
    let transcription;
    try {
      transcription = await transcribeYouTubeVideo(videoUrl, async (progress) => {
        await updateJobProgress(jobId, progress, 'transcribing');
      });
      console.log(`✓ Transcribed: ${transcription.text.length} characters`);
    } catch (error) {
      throw new Error(`Failed to transcribe: ${error.message}`);
    }
    
    await updateJobProgress(jobId, 90, 'transcribing');
    
    // Check if we have actual content
    if (!transcription.text || transcription.text.length < 100) {
      throw new Error('Video has insufficient audio content for processing');
    }
    
    // ═══════════════════════════════════════════════════════════
    // STEP 3: Save video (no AI generation yet)
    // ═══════════════════════════════════════════════════════════
    
    // Create video document. summary/keyPoints/quiz are left empty -
    // they're generated on demand later, from the stored transcript below.
    const video = await Video.create({
      userId,
      youtubeVideoId: metadata.videoId,
      videoUrl,
      videoTitle: metadata.title,
      thumbnail: metadata.thumbnail,
      duration: metadata.duration,
      channelName: metadata.channelName,
      folderId,
      displayTitle,
      transcript: transcription.text,
      transcriptSource: transcription.source || null,
      summary: null,
      keyPoints: [],
      quiz: []
    });
    
    console.log(`✓ Saved video: ${video._id}`);
    
    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.videosProcessed': 1 },
      $set: { 'stats.lastActiveDate': new Date() }
    });
    
    // Mark job as completed
    await ProcessingJob.findByIdAndUpdate(jobId, {
      status: 'completed',
      progress: 100,
      currentStep: null,
      resultVideoId: video._id,
      completedAt: new Date(),
      steps: [
        { name: 'fetching', status: 'completed' },
        { name: 'transcribing', status: 'completed' }
      ]
    });
    
    console.log(`\n========================================`);
    console.log(`✓ Processing complete: ${video._id}`);
    console.log(`========================================\n`);
    
    return video;
    
  } catch (error) {
    console.error(`\n========================================`);
    console.error(`✗ Processing failed: ${error.message}`);
    console.error(`========================================\n`);
    
    // Mark job as failed
    await ProcessingJob.findByIdAndUpdate(jobId, {
      status: 'failed',
      errorMessage: error.message,
      completedAt: new Date()
    });
    
    throw error;
  }
}

module.exports = { 
  processVideo, 
  updateJobProgress 
};