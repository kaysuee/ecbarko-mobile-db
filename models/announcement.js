const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'urgent', 'maintenance', 'general'],
    default: 'general'
  },
  scheduleAffected: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'sent', 'expired', 'cancelled'],
    default: 'draft'
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  targetUsers: {
    type: [String], // Array of user IDs
    default: [] // Empty array means all users
  },

  // Legacy field support - map sentTo to targetUsers
  sentTo: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
announcementSchema.index({ status: 1, dateCreated: -1 });
announcementSchema.index({ type: 1, isActive: 1 });
announcementSchema.index({ targetUsers: 1, isActive: 1 });

// Virtual for checking if announcement is expired
announcementSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Method to mark announcement as read by a user
announcementSchema.methods.markAsRead = async function(userId) {
  if (!this.readBy) {
    this.readBy = [];
  }
  
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
    await this.save();
  }
};

// Method to check if user has read the announcement
announcementSchema.methods.isReadBy = function(userId) {
  return this.readBy && this.readBy.includes(userId);
};

// Pre-save middleware to ensure required fields exist
announcementSchema.pre('save', function(next) {
  // Set default priority if missing
  if (!this.priority) {
    this.priority = 'medium';
  }
  
  // Set default isActive if missing
  if (this.isActive === undefined) {
    this.isActive = true;
  }
  
  // Set default expiresAt if missing (30 days from now)
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  // Ensure targetUsers is an array
  if (!this.targetUsers || !Array.isArray(this.targetUsers)) {
    this.targetUsers = [];
  }
  
  next();
});

module.exports = mongoose.model('Announcement', announcementSchema, 'announcement');
