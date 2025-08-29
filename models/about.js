const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
  aboutText: {
    type: String,
    required: true,
    trim: true
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  author: {
    type: String,
    default: 'System'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
aboutSchema.index({ isActive: 1, updatedAt: -1 });

// Virtual for checking if about text is recent (updated within last 30 days)
aboutSchema.virtual('isRecent').get(function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.updatedAt > thirtyDaysAgo;
});

// Method to get the latest active about text
aboutSchema.statics.getLatest = async function() {
  return this.findOne({ isActive: true }).sort({ updatedAt: -1 });
};

// Method to create or update about text
aboutSchema.statics.upsertAbout = async function(aboutText, author = 'System', notes = '') {
  const existing = await this.findOne({ isActive: true });
  
  if (existing) {
    // Update existing
    existing.aboutText = aboutText;
    existing.author = author;
    existing.notes = notes;
    existing.version = this.incrementVersion(existing.version);
    return await existing.save();
  } else {
    // Create new
    return await this.create({
      aboutText,
      author,
      notes
    });
  }
};

// Helper method to increment version
aboutSchema.statics.incrementVersion = function(currentVersion) {
  const parts = currentVersion.split('.');
  if (parts.length === 3) {
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }
  return currentVersion;
};

module.exports = mongoose.model('About', aboutSchema);
