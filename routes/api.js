const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Otp = require('../models/otp');
const Card = require('../models/card');
const CardHistory = require('../models/cardHistory');
const ActiveBooking = require('../models/activebooking.js');
const Eticket = require('../models/eticket');
const jwt = require('jsonwebtoken');
const Schedule = require('../models/schedule');
require('dotenv').config();  
const { sendOtpEmail, sendPDFEmail } = require('../utils/email');



// GET USER DETAILS
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({
      id: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      birthdate: user.birthdate,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET Card DETAILS
router.get('/card/:userId', async (req, res) => {
  try {

    const card = await Card.findOne({ userId: req.params.userId });

    if (!card) return res.status(404).json({ error: 'Card not found' });

    res.status(200).json({
      cardNumber: card.cardNumber,
      balance: card.balance,
      type: card.type,
      status: card.status,
      lastActive: card.lastActive,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// buy LOad Card DETAILS
router.post('/buyload/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { amount } = req.body;

    // Validate amount
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount provided' });
    }

    const numericAmount = Number(amount);

    const card = await Card.findOne({ userId });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Add balance
    card.balance = Number(card.balance) + numericAmount;

    // Create history
    const cardHistory = new CardHistory({
      userId,
      payment: numericAmount,
      dateTransaction: new Date(),
      status: 'Confirmed',
      type: 'Load',
    });

    await cardHistory.save();
    await card.save();

    res.status(200).json({ message: 'Load added successfully', newBalance: card.balance });
  } catch (err) {
    console.error("Server error in /buyload:", err);
    res.status(500).json({ error: 'Server error' });
  }
});



// GET Card History DETAILS
router.get('/cardHistory/:userId', async (req, res) => {
  try {
    const cardHistory = await CardHistory.find({ userId: req.params.userId }).sort({ dateTransaction: -1 });
   
    if (!cardHistory) return res.status(404).json({ error: 'Card not found' });

    const formattedHistory = cardHistory.map(card => {
      const dateTransaction = card.dateTransaction instanceof Date ? card.dateTransaction.toISOString() : null;

      return {
        ...card.toObject(),
        dateTransaction, // Ensure we are only formatting a valid Date
      };
    });

  res.status(200).json(formattedHistory);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET Active Booking
router.get('/actbooking/:userId', async (req, res) => {
  try {
    const activeBooking = await ActiveBooking.find({ userId: req.params.userId }).sort({ dateTransaction: -1 });

    if (!activeBooking) return res.status(404).json({ error: 'Active Booking Not Found' });

    const formattedBooking = activeBooking.map(booking => {
      const dateTransaction = booking.departDate instanceof Date ? booking.departDate.toISOString() : null;

      return {
        ...booking.toObject(),
        dateTransaction, // Ensure we are only formatting a valid Date
      };
    });
   
  res.status(200).json(formattedBooking);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET Active Booking
router.get('/schedule', async (req, res) => {
  try {
    const schedules = await Schedule.find();
    if (!schedules) return res.status(404).json({ error: 'Active Booking Not Found' })
   
  res.status(200).json(schedules);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update USER DETAILS
router.post('/edituser/:userId', async (req, res) => {
  const { name, email, phone, birthdate, password } = req.body;
  const { userId } = req.params;
  try {
    const user = await User.findOne({ userId: userId });

    if (name) user.name = name;
    if (email && email !== user.email) {
      user.email = email;
    }
    if (phone && phone !== user.phone) {
      user.phone = phone;
    }
    if (birthdate) user.birthdate = birthdate;
    if (password) user.password = password;

    await user.save();

    res.status(200).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


//LOGIN
router.post('/login', async (req, res) => {
 
  try {
    const { email, password } = req.body;
   
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ error: 'User not found' });

   
    if (user.password !== password)
      return res.status(401).json({ error: 'Incorrect password' });


    const payload = {
      userId: user.userId,
      email: user.email,
      status: user.status,
    };
    const token = jwt.sign(payload, 'secretkey', { expiresIn: '1d' });
    res.status(200).json({
      success: true,
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

//REGISTER
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;

  if (!first_name || !last_name || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const xemail = await User.findOne({ email });
    if (xemail) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    const xnumber = await User.findOne({ phone });
    if (xnumber) {
      return res.status(409).json({ message: 'Phone No. already exists' });
    }

    const lastUser = await User.findOne().sort({ createdAt: -1 }).exec();

    let newUserId = 'U0001';

    if (lastUser && lastUser.userId) {
      const lastIdStr = lastUser.userId.replace('U', '');
      const lastIdNum = parseInt(lastIdStr, 10);
      const nextIdNum = lastIdNum + 1;
      newUserId = 'U' + String(nextIdNum).padStart(4, '0');
    }

    const newUser = new User({
      userId: newUserId,
      name: `${first_name} ${last_name}`,
      email,
      phone,
      password,
    });

    await newUser.save();

    res.status(200).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  // Check if an OTP already exists for the email and delete it
  const existingOtp = await Otp.findOne({ email });
  if (existingOtp) {
    await Otp.deleteOne({ _id: existingOtp._id });
  }

  const otp = await generateUniqueOtp();

  await sendOtpEmail(email, otp);

  // Save OTP to the database
  const otpEntry = new Otp({ email, otp });
  await otpEntry.save();

  res.status(200).json({ send: true});
});


router.post('/eticket', async (req, res) => {
  try {
    const {
      email,
      user,
      passengers,
      departureLocation,
      arrivalLocation,
      departDate,
      departTime,
      arriveDate,
      arriveTime,
      shippingLine,
      hasVehicle,
      selectedCardType,
      vehicleDetail,
      bookingReference,
      totalFare,
      schedcde
    } = req.body;
    
    // Create a new Eticket document
    const newEticket = new Eticket({
      user,
      passengers,
      departureLocation,
      arrivalLocation,
      departDate,
      departTime,
      arriveDate,
      arriveTime,
      shippingLine,
      hasVehicle,
      selectedCardType,
      status: 'active',
      vehicleDetail,
      bookingReference,
      totalFare
    });

    // Save to MongoDB
    await newEticket.save();

    const passengerCount = passengers.length;
    const vehicleCount = hasVehicle && Array.isArray(vehicleDetail)
      ? vehicleDetail.length
      : 0;
      console.log("buddy here",passengerCount);
      console.log("buddy here2",vehicleCount);
      console.log("buddy here3",schedcde);
    await Schedule.updateOne(
      {
        schedcde: schedcde,
      },
      {
        $inc: {
          passengerBooked: passengerCount,
          vehicleBooked: vehicleCount
        }
      }
    );

    await sendPDFEmail({
      email,
      passengers,
      departureLocation,
      arrivalLocation,
      departDate,
      departTime,
      arriveDate,
      arriveTime,
      shippingLine,
      hasVehicle,
      selectedCardType,
      vehicleDetail,
      bookingReference,
      totalFare
    });


    res.status(200).json({
      message: 'eTicket created successfully',
      eticketId: newEticket._id,
    });
  } catch (error) {
    console.error('Error saving eTicket:', error);
    res.status(500).json({ message: 'Failed to create eTicket' });
  }
});




router.post('/verify-otp', async (req, res) => {
  const { otp } = req.body;

  const otpEntry = await Otp.findOne({ otp });

  const user = await User.findOne({ email: otpEntry.email });
  user.status = 'active';
  await user.save();
  await Otp.deleteOne({ _id: otpEntry._id });
  res.status(200).json({ verified: true});
});

router.post('/send-reset', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ success: false, message: 'Email not found' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.resetToken = token;
  user.tokenExpiration = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetLink = `https://your-app.com/reset-password?token=${token}`;

  await sendResetEmail(email, 'Reset your password', `Click to reset: ${resetLink}`);

  res.status(200).json({ success: true });
});


async function generateUniqueOtp() {
  let otp;
  let exists = true;

  // Loop until a unique OTP is generated
  while (exists) {
    otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const checkOTP = await Otp.findOne({ otp });
    exists = !!checkOTP; // continue loop if OTP exists
  }

  return otp;
}

// Create new card
router.post('/card', async (req, res) => {
  try {
    const { userId, cardNumber, type } = req.body;

    // Validate required fields
    if (!userId || !cardNumber || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already has a card
    const existingCard = await Card.findOne({ userId });
    if (existingCard) {
      return res.status(400).json({ error: 'User already has a card' });
    }

    // Check if card number is already in use
    const existingCardNumber = await Card.findOne({ cardNumber });
    if (existingCardNumber) {
      return res.status(400).json({ error: 'Card number already in use' });
    }

    // Create new card
    const newCard = new Card({
      userId,
      cardNumber,
      balance: '0',
      type,
      status: 'active',
      lastActive: new Date().toISOString()
    });

    await newCard.save();

    res.status(201).json({
      message: 'Card created successfully',
      card: {
        cardNumber: newCard.cardNumber,
        balance: newCard.balance,
        type: newCard.type,
        status: newCard.status,
        lastActive: newCard.lastActive
      }
    });
  } catch (err) {
    console.error("Server error in /card:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/card/:id', async (req, res) => {
  console.log('PUT /api/card/:id hit', req.params.id, req.body);  // 🔍
  try {
    const cardNumber = req.params.id;
    const updatedCard = await Card.findOneAndUpdate(
      { cardNumber: cardNumber },
      { $set: req.body },
      { new: true }
    );
    if (!updatedCard) {
      return res.status(404).json({ error: 'card not found.' });
    }
    res.status(201).json(updatedCard);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update card' });
  }
});


module.exports = router;
