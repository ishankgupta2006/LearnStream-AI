const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Video = require('../models/Video');
const QuizResult = require('../models/QuizResult');

const router = express.Router();

/**
 * GET /api/stats
 * Get user statistics
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const user = req.user;
    
    // Get weekly progress (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [videosThisWeek, quizzesThisWeek] = await Promise.all([
      Video.aggregate([
        {
          $match: {
            userId: user._id,
            processedAt: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$processedAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      QuizResult.aggregate([
        {
          $match: {
            userId: user._id,
            completedAt: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);
    
    // Build weekly progress array
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const videosOnDay = videosThisWeek.find(v => v._id === dateStr);
      const quizzesOnDay = quizzesThisWeek.find(q => q._id === dateStr);
      
      weeklyProgress.push({
        date: dateStr,
        videosProcessed: videosOnDay?.count || 0,
        quizzesTaken: quizzesOnDay?.count || 0
      });
    }
    
    res.json({
      videosProcessed: user.stats.videosProcessed,
      quizzesTaken: user.stats.quizzesTaken,
      averageScore: user.stats.averageScore,
      totalLearningTime: user.stats.totalLearningTime,
      streak: user.stats.currentStreak,
      longestStreak: user.stats.longestStreak,
      lastActiveAt: user.stats.lastActiveDate,
      weeklyProgress,
      achievements: [] // Can be expanded later
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
