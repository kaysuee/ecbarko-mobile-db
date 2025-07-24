const mongoose = require('mongoose');
const passengerSchema = new mongoose.Schema({
    name: String,
    contact: String
  });

  const vehicleSchema = new mongoose.Schema({
    plateNumber: String,
    carType: String,
    vehicleOwner: String,
  });
const EticketSchema = new mongoose.Schema({
    userID: String,
    passengers: [passengerSchema],
    departureLocation: String,
    arrivalLocation: String,
    departDate: String,
    departTime: String,
    arriveDate: String,
    arriveTime: String,
    shippingLine: String,
    hasVehicle: Boolean,
    selectedCardType: String,
    status: String,
    vehicleDetail: [vehicleSchema],
    bookingReference: String,
    totalFare: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
}, {timestamps: true,
  collection: 'eticket'  // Explicitly define collection name
});

module.exports = mongoose.model('Eticket', EticketSchema);
