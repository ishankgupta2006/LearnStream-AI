const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  id: Number,
  question: String,
  options: [String],
  correctAnswer: Number,
  explanation: String
}, { _id: false });
const timestampNoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  timestamp: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true,
  _id: true
});
const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  youtubeVideoId: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  videoTitle: {
    type: String,
    required: true
  },
  thumbnail: String,
  duration: Number,
  channelName: String,
  
  folderId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Folder',
  default: null,
  index: true
},
displayTitle: {
  type: String,
  trim: true,
  maxlength: 150,
  default: null
},
learningStatus: {
  type: String,
  enum: ['not-started', 'in-progress', 'completed'],
  default: 'not-started'
},
completedAt: {
  type: Date,
  default: null
},

  summary: {
    type: String,
    default: null
  },
  keyPoints: {
    type: [String],
    default: []
  },
  quiz: {
    type: [quizQuestionSchema],
    default: []
  },
  // The raw transcript (or metadata-fallback text) fetched when the video
  // was added. Stored so Summary/Key Points/Quiz can each be generated
  // on-demand later without re-fetching the transcript every time.
  transcript: {
    type: String,
    default: null
  },
  transcriptSource: {
    type: String,
    default: null
  },
    notes: {
    type: [timestampNoteSchema],
    default: []
  },
  quizTaken: {
    type: Boolean,
    default: false
  },

  quizScore: Number,
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate videos per user
videoSchema.index({ userId: 1, youtubeVideoId: 1 }, { unique: true });
videoSchema.index({ userId: 1, processedAt: -1 });

module.exports = mongoose.model('Video', videoSchema);
