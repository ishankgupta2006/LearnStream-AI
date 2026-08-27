const express = require('express');
const mongoose = require('mongoose');

const { authenticateToken } = require('../middleware/auth');
const Folder = require('../models/Folder');
const Video = require('../models/Video');

const router = express.Router();

function escapeRegExp(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

/*
  GET /api/folders
  Gets all folders for the logged-in user.
  Optional: /api/folders?search=react
*/
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const search = (req.query.search || '').trim();

    const query = {
      userId: req.user._id
    };

    if (search) {
      query.name = {
        $regex: escapeRegExp(search),
        $options: 'i'
      };
    }

    const folders = await Folder.find(query).sort({ updatedAt: -1 });

    const folderIds = folders.map((folder) => folder._id);

    const videoStats = await Video.aggregate([
      {
        $match: {
          userId: req.user._id,
          folderId: { $in: folderIds }
        }
      },
      {
        $group: {
          _id: '$folderId',
          videoCount: { $sum: 1 },
          completedCount: {
            $sum: {
              $cond: [
                { $eq: ['$learningStatus', 'completed'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const statsByFolderId = new Map(
      videoStats.map((stat) => [String(stat._id), stat])
    );

    const result = folders.map((folder) => {
      const stats = statsByFolderId.get(String(folder._id)) || {
        videoCount: 0,
        completedCount: 0
      };

      const progress =
        stats.videoCount === 0
          ? 0
          : Math.round((stats.completedCount / stats.videoCount) * 100);

      return {
        id: folder._id,
        name: folder.name,
        color: folder.color,
        icon: folder.icon,
        videoCount: stats.videoCount,
        completedCount: stats.completedCount,
        progress,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      };
    });

    res.json({
      success: true,
      folders: result
    });
  } catch (error) {
    next(error);
  }
});

/*
  POST /api/folders
  Creates a folder.
*/
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, color, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required'
      });
    }

    const folder = await Folder.create({
      userId: req.user._id,
      name: name.trim(),
      color: color || '#6366f1',
      icon: icon || 'folder'
    });

    res.status(201).json({
      success: true,
      folder: {
        id: folder._id,
        name: folder.name,
        color: folder.color,
        icon: folder.icon,
        videoCount: 0,
        completedCount: 0,
        progress: 0,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A folder with this name already exists'
      });
    }

    next(error);
  }
});

/*
  PATCH /api/folders/:folderId
  Renames a folder or changes its colour.
*/
router.patch('/:folderId', authenticateToken, async (req, res, next) => {
  try {
    const { folderId } = req.params;
    const { name, color, icon } = req.body;

    if (!isValidId(folderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid folder ID'
      });
    }

    const folder = await Folder.findOne({
      _id: folderId,
      userId: req.user._id
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Folder name cannot be empty'
        });
      }

      folder.name = name.trim();
    }

    if (color !== undefined) folder.color = color;
    if (icon !== undefined) folder.icon = icon;

    await folder.save();

    res.json({
      success: true,
      folder: {
        id: folder._id,
        name: folder.name,
        color: folder.color,
        icon: folder.icon,
        updatedAt: folder.updatedAt
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A folder with this name already exists'
      });
    }

    next(error);
  }
});

/*
  DELETE /api/folders/:folderId
  Deletes the folder but keeps its videos safe as Unfiled.
*/
router.delete('/:folderId', authenticateToken, async (req, res, next) => {
  try {
    const { folderId } = req.params;

    if (!isValidId(folderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid folder ID'
      });
    }

    const folder = await Folder.findOneAndDelete({
      _id: folderId,
      userId: req.user._id
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    // Videos are NOT deleted. They become Unfiled.
    await Video.updateMany(
      {
        userId: req.user._id,
        folderId: folder._id
      },
      {
        $set: {
          folderId: null
        }
      }
    );

    res.json({
      success: true,
      message: 'Folder deleted. Its videos are still available in Unfiled videos.'
    });
  } catch (error) {
    next(error);
  }
});
/*
  GET /api/folders/:folderId/videos
  Gets all videos inside one folder.
  Optional: ?search=react
*/
router.get('/:folderId/videos', authenticateToken, async (req, res, next) => {
  try {
    const { folderId } = req.params;
    const search = (req.query.search || '').trim();

    if (!isValidId(folderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid folder ID'
      });
    }

    const folder = await Folder.findOne({
      _id: folderId,
      userId: req.user._id
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    const query = {
      userId: req.user._id,
      folderId
    };

    if (search) {
      const searchRegex = {
        $regex: escapeRegExp(search),
        $options: 'i'
      };

      query.$or = [
        { videoTitle: searchRegex },
        { displayTitle: searchRegex },
        { channelName: searchRegex }
      ];
    }

    const videos = await Video.find(query)
      .select(
        'videoUrl videoTitle displayTitle youtubeVideoId thumbnail duration channelName processedAt quizTaken quizScore learningStatus completedAt'
      )
      .sort({ processedAt: -1 });

    res.json({
      success: true,
      folder: {
        id: folder._id,
        name: folder.name,
        color: folder.color
      },
      videos: videos.map((video) => ({
        id: video._id,
        videoUrl: video.videoUrl,
        videoTitle: video.videoTitle,
        displayTitle: video.displayTitle,
        videoId: video.youtubeVideoId,
        thumbnail: video.thumbnail,
        duration: video.duration,
        channelName: video.channelName,
        processedAt: video.processedAt,
        quizTaken: video.quizTaken,
        quizScore: video.quizScore,
        learningStatus: video.learningStatus,
        completedAt: video.completedAt
      }))
    });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
