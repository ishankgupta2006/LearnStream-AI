const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Video = require('../models/Video');
const QuizResult = require('../models/QuizResult');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /api/history
 * Get user's processed video history
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sort = 'recent',
      search 
    } = req.query;
    
    const query = { userId: req.user._id };
    
    // Search by title
    if (search) {
      query.videoTitle = { $regex: search, $options: 'i' };
    }
    
    const sortOrder = sort === 'oldest' ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 50); // Max 50 per page
    
    const [videos, total] = await Promise.all([
      Video.find(query)
        .select('videoUrl videoTitle youtubeVideoId thumbnail processedAt quizScore quizTaken duration channelName keyPoints quiz')
        .sort({ processedAt: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Video.countDocuments(query)
    ]);
    
    res.json({
      videos: videos.map(v => ({
        id: v._id,
        videoUrl: v.videoUrl,
        videoTitle: v.videoTitle,
        videoId: v.youtubeVideoId,
        thumbnail: v.thumbnail,
        duration: v.duration,
        channelName: v.channelName,
        processedAt: v.processedAt,
        quizScore: v.quizScore,
        quizTaken: v.quizTaken,
        keyPointsCount: v.keyPoints?.length || 0,
        quizCount: v.quiz?.length || 0
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/history/:videoId
 * Remove video from user's history
 */
router.delete('/:videoId', authenticateToken, async (req, res, next) => {
  try {
    const video = await Video.findOneAndDelete({
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
    
    // Also delete quiz results for this video
    await QuizResult.deleteMany({ 
      videoId: req.params.videoId,
      userId: req.user._id 
    });
    
    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.videosProcessed': -1 }
    });
    
    res.json({
      success: true,
      message: 'Video removed from history'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/history
 * Clear all user's history
 */
router.delete('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await Video.deleteMany({ userId: req.user._id });
    
    // Delete all quiz results
    await QuizResult.deleteMany({ userId: req.user._id });
    
    // Reset user stats
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'stats.videosProcessed': 0,
        'stats.quizzesTaken': 0,
        'stats.totalScore': 0,
        'stats.averageScore': 0
      }
    });
    
    res.json({
      success: true,
      message: 'History cleared',
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
