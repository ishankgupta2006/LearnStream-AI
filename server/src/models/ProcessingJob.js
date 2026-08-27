const mongoose = require('mongoose');

const processingJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  videoTitle: String,
  folderId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Folder',
  default: null
},
displayTitle: {
  type: String,
  trim: true,
  default: null
},
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed'],
    default: 'queued'
  },
  progress: {
    type: Number,
    default: 0
  },
  currentStep: {
    type: String,
    enum: ['fetching', 'transcribing', 'summarizing', 'extracting', 'quiz-generation', null],
    default: null
  },
  steps: [{
    name: String,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'failed']
    }
  }],
  resultVideoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  },
  errorMessage: String,
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

processingJobSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('ProcessingJob', processingJobSchema);
