const mongoose = require('mongoose');

const CardHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true }, 
  description: { type: String}, 
  dateTransaction: { type: Date, required: true },
  payment: { type: Number, required: true }, 
  status: { type: String},
  type: { type: String, required: true }, 
}, {timestamps: true,
  collection: 'cardHistory'  // Explicitly define collection name
});

module.exports = mongoose.model('cardHistory', CardHistorySchema);
