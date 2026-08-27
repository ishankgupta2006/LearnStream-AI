const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const QuizResult = require('../models/QuizResult');
const Video = require('../models/Video');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/quiz/submit
 * Submit quiz answers
 */
router.post('/submit', authenticateToken, async (req, res, next) => {
  try {
    const { videoId, answers, timeTaken } = req.body;
    const userId = req.user._id;
    
    // Validation
    if (!videoId || !answers) {
      return res.status(400).json({
        success: false,
        error: 'Video ID and answers are required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Find video
    const video = await Video.findOne({ _id: videoId, userId });
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found',
        code: 'NOT_FOUND'
      });
    }
    
    // Calculate score
    let score = 0;
    const results = [];
    
    video.quiz.forEach((question) => {
      const userAnswer = answers[question.id];
      const correct = userAnswer === question.correctAnswer;
      
      if (correct) score++;
      
      results.push({
        questionId: question.id,
        correct,
        selectedAnswer: userAnswer !== undefined ? userAnswer : -1,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      });
    });
    
    const totalQuestions = video.quiz.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    // Save quiz result
    const quizResult = await QuizResult.create({
      userId,
      videoId,
      answers,
      score,
      totalQuestions,
      percentage,
      timeTaken: timeTaken || 0,
      results
    });
    
    // Update video
    video.quizTaken = true;
    video.quizScore = percentage;
    await video.save();
    
    // Update user stats
    const user = await User.findById(userId);
    user.stats.quizzesTaken += 1;
    user.stats.totalScore += score;
    
    // Calculate new average
    const totalPossibleScore = user.stats.quizzesTaken * 10; // Assuming 10 questions per quiz
    user.stats.averageScore = Math.round((user.stats.totalScore / totalPossibleScore) * 100);
    
    user.stats.totalLearningTime += Math.round((timeTaken || 0) / 60);
    user.stats.lastActiveDate = new Date();
    
    // Update streak
    const today = new Date().toDateString();
    const lastActive = user.stats.lastActiveDate ? user.stats.lastActiveDate.toDateString() : null;
    
    if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastActive === yesterday) {
        user.stats.currentStreak += 1;
        if (user.stats.currentStreak > user.stats.longestStreak) {
          user.stats.longestStreak = user.stats.currentStreak;
        }
      } else {
        user.stats.currentStreak = 1;
      }
    }
    
    await user.save();
    
    res.json({
      success: true,
      score,
      totalQuestions,
      percentage,
      timeTaken: timeTaken || 0,
      results,
      statsUpdate: {
        quizzesTaken: user.stats.quizzesTaken,
        averageScore: user.stats.averageScore,
        totalLearningTime: user.stats.totalLearningTime,
        currentStreak: user.stats.currentStreak
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quiz/history
 * Get user's quiz history
 */
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const quizzes = await QuizResult.find({ userId: req.user._id })
      .populate('videoId', 'videoTitle thumbnail youtubeVideoId')
      .sort({ completedAt: -1 })
      .limit(50);
    
    const stats = {
      totalQuizzes: quizzes.length,
      averageScore: req.user.stats.averageScore,
      bestScore: quizzes.length > 0 
        ? Math.max(...quizzes.map(q => q.percentage))
        : 0,
      totalTime: quizzes.reduce((sum, q) => sum + (q.timeTaken || 0), 0)
    };
    
    res.json({
      quizzes: quizzes.map(q => ({
        id: q._id,
        videoId: q.videoId?._id,
        videoTitle: q.videoId?.videoTitle,
        videoThumbnail: q.videoId?.thumbnail,
        score: q.score,
        totalQuestions: q.totalQuestions,
        percentage: q.percentage,
        timeTaken: q.timeTaken,
        completedAt: q.completedAt
      })),
      stats
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quiz/:quizId
 * Get specific quiz result details
 */
router.get('/:quizId', authenticateToken, async (req, res, next) => {
  try {
    const quiz = await QuizResult.findOne({
      _id: req.params.quizId,
      userId: req.user._id
    }).populate('videoId', 'videoTitle thumbnail quiz');
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz result not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.json({
      id: quiz._id,
      videoId: quiz.videoId?._id,
      videoTitle: quiz.videoId?.videoTitle,
      videoThumbnail: quiz.videoId?.thumbnail,
      score: quiz.score,
      totalQuestions: quiz.totalQuestions,
      percentage: quiz.percentage,
      timeTaken: quiz.timeTaken,
      results: quiz.results,
      completedAt: quiz.completedAt
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
