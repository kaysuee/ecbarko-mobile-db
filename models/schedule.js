const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  schedcde: { type: String, required: true },
  date: { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  shippingLines: { type: String, required: true },
  passengerBooked: { type: Number, default: 0 },
  passengerCapacity: { type: Number, default: 0 },
  vehicleBooked: { type: Number, default: 0 },
  vehicleCapacity: { type: Number, default: 0 },
}, {
  timestamps: true
});

module.exports = mongoose.model('Schedule', scheduleSchema, 'schedule');