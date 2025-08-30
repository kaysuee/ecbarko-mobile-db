const mongoose = require('mongoose');
const Announcement = require('./models/announcement');

// Connect to MongoDB
const mongoURI = "mongodb+srv://edsonpaul98:edsonpaul@cluster0.jnayloj.mongodb.net/ecbarko-web-portal?retryWrites=true&w=majority&appName=Cluster0";

async function manageAnnouncements() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas');

    // Find all announcements
    const allAnnouncements = await Announcement.find({}).sort({ dateCreated: -1 });
    console.log(`📊 Total announcements in database: ${allAnnouncements.length}`);

    // Display all announcements with more details
    console.log('\n📋 All announcements:');
    allAnnouncements.forEach((ann, index) => {
      console.log(`${index + 1}. "${ann.title}"`);
      console.log(`   - Message: ${ann.message}`);
      console.log(`   - Type: ${ann.type}`);
      console.log(`   - Priority: ${ann.priority}`);
      console.log(`   - Status: ${ann.status}`);
      console.log(`   - Is Active: ${ann.isActive}`);
      console.log(`   - Created: ${ann.dateCreated}`);
      console.log(`   - ID: ${ann._id}`);
      console.log('');
    });

    // Check for duplicate or similar announcements
    const duplicateTitles = {};
    allAnnouncements.forEach(ann => {
      const title = ann.title.toLowerCase().trim();
      if (!duplicateTitles[title]) {
        duplicateTitles[title] = [];
      }
      duplicateTitles[title].push(ann);
    });

    console.log('🔍 Duplicate/similar titles found:');
    Object.entries(duplicateTitles).forEach(([title, announcements]) => {
      if (announcements.length > 1) {
        console.log(`\n📝 "${title}" (${announcements.length} instances):`);
        announcements.forEach((ann, index) => {
          console.log(`   ${index + 1}. ID: ${ann._id}, Created: ${ann.dateCreated}, Active: ${ann.isActive}`);
        });
      }
    });

    // Option to remove specific announcements by ID
    console.log('\n🎯 To remove specific announcements, you can:');
    console.log('1. Deactivate them (set isActive: false)');
    console.log('2. Change their status to "cancelled" or "expired"');
    console.log('3. Delete them completely');
    
    // Example: Remove announcements with "Delayed Departure" title
    const delayedAnnouncements = allAnnouncements.filter(ann => 
      ann.title.toLowerCase().includes('delayed departure')
    );

    if (delayedAnnouncements.length > 0) {
      console.log(`\n🚢 Found ${delayedAnnouncements.length} "Delayed Departure" announcements`);
      
      // Ask if user wants to remove these
      console.log('Do you want to remove these "Delayed Departure" announcements? (y/n)');
      console.log('Note: This will deactivate them by setting isActive: false');
      
      // For now, let's just show what would happen
      console.log('\n📋 These announcements would be affected:');
      delayedAnnouncements.forEach((ann, index) => {
        console.log(`${index + 1}. "${ann.title}" (ID: ${ann._id})`);
      });
    }

    // Verify current state
    const activeAnnouncements = await Announcement.find({ isActive: true });
    console.log(`\n📊 Currently active announcements: ${activeAnnouncements.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the function
manageAnnouncements();
