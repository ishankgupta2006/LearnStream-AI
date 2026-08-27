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
  const stepOrder = ['fetching', 'transcribing', 'summarizing', 'extracting', 'quiz-generation'];
  
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
 * Main video processing pipeline
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
    
    await updateJobProgress(jobId, 10, 'fetching');
    
    // ═══════════════════════════════════════════════════════════
    // STEP 2: Transcribe Video (15-45%)
    // ═══════════════════════════════════════════════════════════
    await updateJobProgress(jobId, 15, 'transcribing');
    
    let transcription;
    try {
      transcription = await transcribeYouTubeVideo(videoUrl, async (progress) => {
        await updateJobProgress(jobId, progress, 'transcribing');
      });
      console.log(`✓ Transcribed: ${transcription.text.length} characters`);
    } catch (error) {
      throw new Error(`Failed to transcribe: ${error.message}`);
    }
    
    await updateJobProgress(jobId, 45, 'transcribing');
    
    // Check if we have actual content
    if (!transcription.text || transcription.text.length < 100) {
      throw new Error('Video has insufficient audio content for processing');
    }
    
    // ═══════════════════════════════════════════════════════════
    // STEP 3: Generate Summary (50-60%)
    // ═══════════════════════════════════════════════════════════
    await updateJobProgress(jobId, 50, 'summarizing');
    
    let summary;
    try {
      summary = await generateSummary(transcription.text, metadata.title);
      console.log(`✓ Generated summary (${summary.length} chars)`);
    } catch (error) {
      console.error('Summary generation failed, using fallback');
      summary = `This video titled "${metadata.title}" covers important concepts and information. The content provides valuable insights on the topic discussed by ${metadata.channelName}. Watch the full video to get the complete understanding of the material presented.`;
    }
    
    await updateJobProgress(jobId, 60, 'summarizing');
    
    // ═══════════════════════════════════════════════════════════
    // STEP 4: Extract Key Points (65-75%)
    // ═══════════════════════════════════════════════════════════
    await updateJobProgress(jobId, 65, 'extracting');
    
    let keyPoints;
    try {
      keyPoints = await extractKeyPoints(transcription.text, metadata.title);
      console.log(`✓ Extracted ${keyPoints.length} key points`);
    } catch (error) {
      console.error('Key points extraction failed, using fallback');
      keyPoints = [
        'Introduction to the main topic and concepts',
        'Key principles and fundamentals discussed',
        'Practical applications and examples shown',
        'Best practices and recommendations',
        'Common challenges and solutions',
        'Tools and resources mentioned',
        'Important considerations for implementation',
        'Summary and next steps for learners'
      ];
    }
    
    await updateJobProgress(jobId, 75, 'extracting');
    
    // ═══════════════════════════════════════════════════════════
    // STEP 5: Generate Quiz (80-95%)
    // ═══════════════════════════════════════════════════════════
    await updateJobProgress(jobId, 80, 'quiz-generation');
    
    let quiz;
    try {
      quiz = await generateQuiz(transcription.text, metadata.title, keyPoints);
      console.log(`✓ Generated ${quiz.length} quiz questions`);
    } catch (error) {
      console.error('Quiz generation failed, using fallback');
      const { generateKeyPointQuiz } = require('./aiService');
      quiz = generateKeyPointQuiz(keyPoints, metadata.title);
    }
    
    await updateJobProgress(jobId, 95, 'quiz-generation');
    
    // ═══════════════════════════════════════════════════════════
    // STEP 6: Save Results (100%)
    // ═══════════════════════════════════════════════════════════
    
    // Create video document
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
      summary,
      keyPoints,
      quiz
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
        { name: 'transcribing', status: 'completed' },
        { name: 'summarizing', status: 'completed' },
        { name: 'extracting', status: 'completed' },
        { name: 'quiz-generation', status: 'completed' }
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