const mongoose = require('mongoose');

const ActiveBookingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  bookingId: { type: String, required: true },
  departureLocation: { type: String, required: true },
  arrivalLocation: { type: String, required: true },
  departDate: { type: Date, required: true },
  departTime: { type: String, required: true },
  arriveDate: { type: String, default: '' }, // Add arrival date
  arriveTime: { type: String, default: '' }, // Add arrival time
  passengers: { type: Number, required: true },
  hasVehicle: { type: Boolean, default: false },
  vehicleType: { type: String, default: '' },
  status: { type: String, default: 'active' },
  shippingLine: { type: String, required: true },
  departurePort: { type: String, required: true },
  arrivalPort: { type: String, required: true },
  payment: { type: Number, required: true },
  isPaid: { type: String, required: true, default: 'active' },
  bookingDate: { type: String, default: '' }, // Add booking date
  isRoundTrip: { type: Boolean, default: false }, // Add round trip flag
  passengerDetails: [{ // Add passenger details
    name: String,
    contact: String
  }],
  vehicleInfo: { // Add vehicle info
    vehicleType: String,
    plateNumber: String,
    vehicleOwner: String
  }
}, {
  timestamps: true,
  collection: 'activebooking'
});

module.exports = mongoose.model('activebooking', ActiveBookingSchema);
