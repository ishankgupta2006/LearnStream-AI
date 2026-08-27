const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },

    // Used to prevent duplicate names like "React" and "react"
    nameKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    color: {
      type: String,
      default: '#6366f1'
    },

    icon: {
      type: String,
      default: 'folder'
    }
  },
  {
    timestamps: true
  }
);

// One user cannot create two folders with the same name.
folderSchema.index({ userId: 1, nameKey: 1 }, { unique: true });

folderSchema.pre('validate', function setNameKey(next) {
  if (this.name) {
    this.nameKey = this.name.trim().toLowerCase();
  }

  next();
});

module.exports = mongoose.model('Folder', folderSchema);