const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, 
  cardNumber: { type: String, required: true, unique: true }, 
  balance: { type: String, required: true }, 
  type: { type: String, required: true }, 
  status: { type: String},
  lastActive: { type: String}, 
}, {timestamps: true,
  collection: 'card'  // Explicitly define collection name
});

module.exports = mongoose.model('card', CardSchema);
