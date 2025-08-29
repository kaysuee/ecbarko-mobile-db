const mongoose = require('mongoose');
const About = require('./models/about');
require('dotenv').config();

const seedAboutText = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecbarko');
    console.log('✅ Connected to MongoDB');

    // Check if about text already exists
    const existingAbout = await About.findOne({ isActive: true });
    
    if (existingAbout) {
      console.log('📖 About text already exists, skipping seed');
      return;
    }

    // Create initial about text
    const aboutData = await About.create({
      aboutText: "ECBARKO is a mobile application designed to enhance the convenience and efficiency of sea travel for passengers and ferry operators alike. With a user-friendly interface, the app allows travelers to browse updated ferry schedules, secure reservations, and receive instant notifications on trip changes or delays. ECBARKO also offers helpful travel tips, terminal information, and digital ticketing features to eliminate long queues and paperwork. By integrating modern technology into maritime travel, ECBARKO brings safety, transparency, and ease right to your fingertips—ensuring that every journey is smooth, timely, and stress-free.",
      version: '1.0.0',
      isActive: true,
      author: 'System',
      notes: 'Initial about text created during database setup'
    });

    console.log('✅ About text seeded successfully:', aboutData._id);
    console.log('📖 About text content:', aboutData.aboutText.substring(0, 100) + '...');

  } catch (error) {
    console.error('❌ Error seeding about text:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seed function
seedAboutText();
