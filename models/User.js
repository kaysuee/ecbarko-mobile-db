const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },  // Unique identifier for the user (like a UUID or MongoDB _id)
  name: { type: String, required: true },  // Name of the user
  email: { type: String, required: true, unique: true }, 
  phone: { type: String, required: true }, // User's email, should be unique
  password: { type: String, required: true }, 
  birthdate: { type: String, default: ''}, // Password (no encryption as you mentioned)
  status: { type: String, default: 'inactive' },  // User's status, default value is 'active'
  profileImageUrl: {
    data: Buffer,
    contentType: String
  },
}, {timestamps: true,
  collection: 'userAccounts'  // Explicitly define collection name
});

module.exports = mongoose.model('userAccounts', UserSchema);
