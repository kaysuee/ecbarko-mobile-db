const mongoose = require('mongoose');

const ActiveBookingSchema = new mongoose.Schema({
  userId: { type: String, required: true }, 
  bookingId: { type: String, required: true}, 
  departureLocation: { type: String, required: true },
  arrivalLocation: { type: String, required: true },
  departDate: { type: Date, required: true },
  departTime : { type: String, required: true },
  passengers: { type: String, required: true },
  hasVehicle : { type: Boolean, default: false },
  status: { type: String, default: 'inactive' },
  shippingLine: { type: String, required: true },
  departurePort: { type: String, required: true },
  arrivalPort: { type: String, required: true },
}, {timestamps: true,
  collection: 'activebooking'  // Explicitly define collection name
});

module.exports = mongoose.model('activebooking', ActiveBookingSchema);
