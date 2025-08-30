const mongoose = require('mongoose');
const Announcement = require('./models/announcement');

// Connect to MongoDB
const mongoURI = "mongodb+srv://edsonpaul98:edsonpaul@cluster0.jnayloj.mongodb.net/ecbarko-web-portal?retryWrites=true&w=majority&appName=Cluster0";

async function removeTestAnnouncements() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas');

    // Find all announcements
    const allAnnouncements = await Announcement.find({}).sort({ dateCreated: -1 });
    console.log(`📊 Total announcements in database: ${allAnnouncements.length}`);

    // Display all announcements to help identify the test one
    console.log('\n📋 All announcements:');
    allAnnouncements.forEach((ann, index) => {
      console.log(`${index + 1}. "${ann.title}"`);
      console.log(`   - Message: ${ann.message.substring(0, 100)}...`);
      console.log(`   - Type: ${ann.type}`);
      console.log(`   - Priority: ${ann.priority}`);
      console.log(`   - Status: ${ann.status}`);
      console.log(`   - Is Active: ${ann.isActive}`);
      console.log(`   - Created: ${ann.dateCreated}`);
      console.log(`   - ID: ${ann._id}`);
      console.log('');
    });

    // Look for test announcements (you can modify this logic)
    const testAnnouncements = allAnnouncements.filter(ann => {
      const title = ann.title.toLowerCase();
      const message = ann.message.toLowerCase();
      
      return title.includes('test') || 
             message.includes('test') ||
             title.includes('sample') ||
             message.includes('sample') ||
             title.includes('demo') ||
             message.includes('demo');
    });

    if (testAnnouncements.length > 0) {
      console.log(`🎯 Found ${testAnnouncements.length} potential test announcement(s):`);
      testAnnouncements.forEach((ann, index) => {
        console.log(`${index + 1}. "${ann.title}" (ID: ${ann._id})`);
      });

      // Option 1: Deactivate test announcements
      console.log('\n🔄 Deactivating test announcements...');
      for (const ann of testAnnouncements) {
        await Announcement.findByIdAndUpdate(ann._id, { 
          isActive: false,
          status: 'cancelled'
        });
        console.log(`✅ Deactivated: "${ann.title}"`);
      }

      // Option 2: Delete test announcements (uncomment if you want to delete instead)
      /*
      console.log('\n🗑️ Deleting test announcements...');
      for (const ann of testAnnouncements) {
        await Announcement.findByIdAndDelete(ann._id);
        console.log(`✅ Deleted: "${ann.title}"`);
      }
      */

    } else {
      console.log('✅ No test announcements found');
    }

    // Verify the changes
    const remainingAnnouncements = await Announcement.find({ isActive: true });
    console.log(`\n📊 Remaining active announcements: ${remainingAnnouncements.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the function
removeTestAnnouncements();
