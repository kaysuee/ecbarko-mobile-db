const mongoose = require('mongoose');
const Announcement = require('./models/announcement');
require('dotenv').config();

const seedAnnouncements = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecbarko');
    console.log('✅ Connected to MongoDB');

    // Check if announcements already exist
    const existingAnnouncements = await Announcement.countDocuments();
    
    if (existingAnnouncements > 0) {
      console.log(`📢 ${existingAnnouncements} announcements already exist, skipping seed`);
      return;
    }

    // Create sample announcements
    const sampleAnnouncements = [
      {
        title: 'Welcome to ECBARKO!',
        message: 'Welcome aboard! We\'re excited to have you using our ferry booking app. Enjoy seamless travel booking and real-time updates.',
        type: 'info',
        scheduleAffected: '',
        status: 'sent',
        author: 'ECBARKO Team',
        priority: 'medium',
        isActive: true,
        targetUsers: [],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      {
        title: 'System Maintenance Notice',
        message: 'Scheduled maintenance will occur on Sunday from 2:00 AM to 4:00 AM. Some services may be temporarily unavailable.',
        type: 'maintenance',
        scheduleAffected: 'All routes',
        status: 'sent',
        author: 'System Admin',
        priority: 'high',
        isActive: true,
        targetUsers: [],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        title: 'New Route Available',
        message: 'We\'re excited to announce a new route from Cebu to Bohol starting next week! Book your tickets now.',
        type: 'info',
        scheduleAffected: 'Cebu-Bohol route',
        status: 'sent',
        author: 'Route Manager',
        priority: 'medium',
        isActive: true,
        targetUsers: [],
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      },
      {
        title: 'Weather Advisory',
        message: 'Heavy weather conditions expected this weekend. Some ferry schedules may be affected. Please check for updates.',
        type: 'warning',
        scheduleAffected: 'Weekend routes',
        status: 'sent',
        author: 'Safety Officer',
        priority: 'high',
        isActive: true,
        targetUsers: [],
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
      {
        title: 'Emergency Service Update',
        message: 'Due to technical issues, the 3:00 PM ferry from Cebu to Dumaguete has been cancelled. We apologize for the inconvenience.',
        type: 'urgent',
        scheduleAffected: 'Cebu-Dumaguete 3:00 PM',
        status: 'sent',
        author: 'Operations Team',
        priority: 'critical',
        isActive: true,
        targetUsers: [],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      }
    ];

    // Insert announcements
    const createdAnnouncements = await Announcement.insertMany(sampleAnnouncements);
    
    console.log('✅ Announcements seeded successfully:', createdAnnouncements.length);
    console.log('📢 Sample announcements created:');
    createdAnnouncements.forEach((announcement, index) => {
      console.log(`  ${index + 1}. ${announcement.title} (${announcement.type})`);
    });

  } catch (error) {
    console.error('❌ Error seeding announcements:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seed function
seedAnnouncements();
