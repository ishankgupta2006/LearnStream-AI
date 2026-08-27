const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const ProcessingJob = require('../models/ProcessingJob');
const Video = require('../models/Video');
const Folder = require('../models/Folder');
const { processVideo } = require('../services/videoProcessor');

const router = express.Router();

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url) {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/live\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * POST /api/videos/process
 * Start processing a YouTube video
 */
router.post('/process', authenticateToken, async (req, res, next) => {
  try {
    const { videoUrl, videoTitle, folderId } = req.body;
    const userId = req.user._id;

    console.log('\n>>>>>>>>>> /api/videos/process HIT <<<<<<<<<<');
    console.log('videoUrl:', videoUrl);
    console.log('userId:', userId);
    
    // Validate URL
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'Video URL is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // If a folder was selected, verify it belongs to the logged-in user.
if (folderId) {
  const folder = await Folder.findOne({
    _id: folderId,
    userId
  });

  if (!folder) {
    return res.status(404).json({
      success: false,
      error: 'Selected folder was not found'
    });
  }
}
    
    const youtubeVideoId = extractVideoId(videoUrl);
    if (!youtubeVideoId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid YouTube URL. Please provide a valid YouTube video URL.',
        code: 'INVALID_URL'
      });
    }
    
    // Check if already processed
    const existingVideo = await Video.findOne({ 
      userId, 
      youtubeVideoId 
    });
    
   if (existingVideo) {
  // The user can add an Unfiled video into the selected folder.
  if (folderId && !existingVideo.folderId) {
    existingVideo.folderId = folderId;

    if (videoTitle?.trim()) {
      existingVideo.displayTitle = videoTitle.trim();
    }

    await existingVideo.save();
  }

  // Do not silently move a video from one folder to another.
  if (
    folderId &&
    existingVideo.folderId &&
    String(existingVideo.folderId) !== String(folderId)
  ) {
    return res.status(409).json({
      success: false,
      error: 'This video already belongs to another folder. Move it first.'
    });
  }

  return res.json({
    success: true,
    status: 'already-processed',
    videoId: existingVideo._id,
    message: 'This video has already been processed'
  });
}
    
    // Check for existing pending job
    const existingJob = await ProcessingJob.findOne({
      userId,
      videoUrl,
      status: { $in: ['queued', 'processing'] }
    });

    console.log('existingJob found?', existingJob ? `YES (id=${existingJob._id}, status=${existingJob.status})` : 'NO');
    
    if (existingJob) {
      // A job can get stuck forever in 'queued'/'processing' if the server
      // restarted mid-job, crashed, or a bug caused it to hang without
      // ever calling updateJobProgress again. Without this check, every
      // future attempt to process the SAME video URL would just return
      // this dead job's stale status instead of actually retrying -
      // which looks exactly like "processing never finishes".
      const STALE_JOB_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
      const lastUpdate = existingJob.updatedAt || existingJob.createdAt;
      const isStale = !lastUpdate || (Date.now() - new Date(lastUpdate).getTime() > STALE_JOB_TIMEOUT_MS);

      if (isStale) {
        console.log(`Marking stale processing job ${existingJob._id} as failed (no update for 3+ minutes) - allowing retry`);
        await ProcessingJob.findByIdAndUpdate(existingJob._id, {
          status: 'failed',
          errorMessage: 'Processing timed out (job stopped responding)',
          completedAt: new Date()
        });
        // fall through to create a fresh job below
      } else {
        return res.json({
          success: true,
          jobId: existingJob._id,
          status: existingJob.status,
          progress: existingJob.progress,
          message: 'This video is already being processed'
        });
      }
    }
    
    // Create processing job
    const job = await ProcessingJob.create({
      userId,
      videoUrl,
      videoTitle: videoTitle || 'Processing...',
      folderId: folderId || null,
      displayTitle: videoTitle?.trim() || null,
      status: 'queued',
      progress: 0,
      steps: [
        { name: 'fetching', status: 'pending' },
        { name: 'transcribing', status: 'pending' },
        { name: 'summarizing', status: 'pending' },
        { name: 'extracting', status: 'pending' },
        { name: 'quiz-generation', status: 'pending' }
      ]
    });
    
    console.log(`>>>>>>>>>> Created job ${job._id}, about to call processVideo()... <<<<<<<<<<\n`);

    // Start processing in background
   processVideo(
  job._id,
  videoUrl,
  userId,
  folderId || null,
  videoTitle?.trim() || null
).catch(err => {
      console.error('Background processing error:', err);
    });
    
    res.status(202).json({
      success: true,
      jobId: job._id,
      status: 'queued',
      estimatedTime: 60,
      message: 'Video processing started'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/status/:jobId
 * Get processing job status
 */
router.get('/status/:jobId', authenticateToken, async (req, res, next) => {
  try {
    let job = await ProcessingJob.findOne({
      _id: req.params.jobId,
      userId: req.user._id
    });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        code: 'NOT_FOUND'
      });
    }

    // Self-heal orphaned jobs: if a job is still 'queued'/'processing' but
    // hasn't been updated in 3+ minutes (e.g. the server was restarted
    // mid-job, or it crashed silently), mark it failed right here. Without
    // this, a browser tab that's already polling this exact job would keep
    // polling forever since nothing else would ever flip its status.
    if (['queued', 'processing'].includes(job.status)) {
      const STALE_JOB_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
      const lastUpdate = job.updatedAt || job.createdAt;
      const isStale = !lastUpdate || (Date.now() - new Date(lastUpdate).getTime() > STALE_JOB_TIMEOUT_MS);

      if (isStale) {
        console.log(`Marking stale job ${job._id} as failed during status poll (no update for 3+ minutes)`);
        job = await ProcessingJob.findByIdAndUpdate(
          job._id,
          {
            status: 'failed',
            errorMessage: 'Processing timed out (job stopped responding). Please try again.',
            completedAt: new Date()
          },
          { new: true }
        );
      }
    }
    
    const response = {
      jobId: job._id,
      status: job.status,
      progress: job.progress,
      currentStep: job.currentStep,
      steps: job.steps
    };
    
    if (job.status === 'completed' && job.resultVideoId) {
      response.videoId = job.resultVideoId;
    }
    
    if (job.status === 'failed' && job.errorMessage) {
      response.error = job.errorMessage;
    }
    
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});
/**
 * POST /api/videos/:videoId/notes
 * Saves one timestamped note for the current user.
 */
router.post('/:videoId/notes', authenticateToken, async (req, res, next) => {
  try {
    const { text, timestamp } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Note text is required'
      });
    }

    const noteTimestamp = Number(timestamp);

    if (!Number.isFinite(noteTimestamp) || noteTimestamp < 0) {
      return res.status(400).json({
        success: false,
        error: 'A valid video timestamp is required'
      });
    }

    const video = await Video.findOne({
      _id: req.params.videoId,
      userId: req.user._id
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    video.notes.push({
      text: text.trim(),
      timestamp: Math.floor(noteTimestamp)
    });

    await video.save();

    const note = video.notes[video.notes.length - 1];

    res.status(201).json({
      success: true,
      note
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/videos/:videoId/notes/:noteId
 * Deletes one saved note.
 */
router.delete(
  '/:videoId/notes/:noteId',
  authenticateToken,
  async (req, res, next) => {
    try {
      const video = await Video.findOne({
        _id: req.params.videoId,
        userId: req.user._id
      });

      if (!video) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      const note = video.notes.id(req.params.noteId);

      if (!note) {
        return res.status(404).json({
          success: false,
          error: 'Note not found'
        });
      }

      note.deleteOne();
      await video.save();

      res.json({
        success: true,
        message: 'Note deleted'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/videos/:videoId
 * Get processed video content
 */
router.get('/:videoId', authenticateToken, async (req, res, next) => {
  try {
    const video = await Video.findOne({
      _id: req.params.videoId,
      userId: req.user._id
    });
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.json({
      id: video._id,
      videoUrl: video.videoUrl,
      videoTitle: video.videoTitle,
      videoId: video.youtubeVideoId,
      thumbnail: video.thumbnail,
      duration: video.duration,
      channelName: video.channelName,
      processedAt: video.processedAt,
      summary: video.summary,
      keyPoints: video.keyPoints,
      quiz: video.quiz,
      notes: video.notes,
      quizTaken: video.quizTaken,
      quizScore: video.quizScore
    });
    
  } catch (error) {
    next(error);
  }
});
/*
  PATCH /api/videos/:videoId
  Updates custom title or learning completion status.
*/
router.patch('/:videoId', authenticateToken, async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { displayTitle, learningStatus } = req.body;

    const video = await Video.findOne({
      _id: videoId,
      userId: req.user._id
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    if (displayTitle !== undefined) {
      video.displayTitle = displayTitle.trim() || null;
    }

    if (learningStatus !== undefined) {
      const allowedStatuses = ['not-started', 'in-progress', 'completed'];

      if (!allowedStatuses.includes(learningStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid learning status'
        });
      }

      video.learningStatus = learningStatus;
      video.completedAt =
        learningStatus === 'completed' ? new Date() : null;
    }

    await video.save();

    res.json({
      success: true,
      video: {
        id: video._id,
        displayTitle: video.displayTitle,
        learningStatus: video.learningStatus,
        completedAt: video.completedAt
      }
    });
  } catch (error) {
    next(error);
  }
});
module.exports = router;