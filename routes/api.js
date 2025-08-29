const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Otp = require('../models/otp');
const Card = require('../models/card');
const CardHistory = require('../models/cardHistory');
const ActiveBooking = require('../models/activebooking.js');
const Eticket = require('../models/eticket');
const Notification = require('../models/notification');
const Announcement = require('../models/announcement');
const About = require('../models/about');
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

    // Create notification for card loaded
    try {
      const newNotification = new Notification({
        type: 'card_loaded',
        title: 'Card Loaded',
        message: `₱${numericAmount.toFixed(2)} has been loaded to your ${card.type} card.`,
        userId: userId,
        additionalData: {
          amount: numericAmount,
          cardType: card.type,
          actionRequired: false,
        },
        createdAt: new Date(),
        isRead: false
      });

      await newNotification.save();
      console.log(`✅ Card loaded notification created for user ${userId}`);
    } catch (notificationErr) {
      console.error('⚠️ Failed to create card loaded notification:', notificationErr);
      // Don't fail the main operation if notification fails
    }

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

      // Map the fields to match the frontend expectations
      const bookingObj = booking.toObject();
      return {
        ...bookingObj,
        dateTransaction, // Ensure we are only formatting a valid Date
        // Map payment fields to match frontend model
        paymentStatus: bookingObj.isPaid || 'paid', // Map isPaid to paymentStatus
        totalAmount: bookingObj.payment || 0, // Map payment to totalAmount
        paymentMethod: 'EcBarko Card', // Default method
        transactionId: bookingObj.bookingId || 'N/A', // Use bookingId as transactionId
        // Ensure all required fields are properly formatted
        passengerDetails: bookingObj.passengerDetails || [],
        vehicleInfo: bookingObj.vehicleInfo || null,
        isRoundTrip: bookingObj.isRoundTrip || false,
        arriveDate: bookingObj.arriveDate || '',
        arriveTime: bookingObj.arriveTime || '',
        departurePort: bookingObj.departurePort || bookingObj.departureLocation || '',
        arrivalPort: bookingObj.arrivalPort || bookingObj.arrivalLocation || ''
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

    // Create notification for profile update
    try {
      const updatedFields = [];
      if (name) updatedFields.push('name');
      if (email && email !== user.email) updatedFields.push('email');
      if (phone && phone !== user.phone) updatedFields.push('phone');
      if (birthdate) updatedFields.push('birthdate');
      if (password) updatedFields.push('password');

      if (updatedFields.length > 0) {
        const newNotification = new Notification({
          type: 'profile_update',
          title: 'Profile Updated',
          message: `Your ${updatedFields.join(', ')} has been updated successfully.`,
          userId: userId,
          additionalData: {
            updatedFields: updatedFields,
            actionRequired: false,
          },
          createdAt: new Date(),
          isRead: false
        });

        await newNotification.save();
        console.log(`✅ Profile update notification created for user ${userId}`);
      }
    } catch (notificationErr) {
      console.error('⚠️ Failed to create profile update notification:', notificationErr);
      // Don't fail the main operation if notification fails
    }

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

   let card = await Card.findOne({ userId: user, status: 'active' });
    if (!card) {
      return res.status(404).json({ error: 'Active card not found' });
    }else if (Number(card.balance) < Number(totalFare)) {
      return res.status(402).json({ error: 'Insufficient funds' });
    }

    card.balance = (Number(card.balance) - Number(totalFare)).toFixed(2);
    await card.save();

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



     // Create a new book document
     const activebook = new ActiveBooking({
      userId: user,
      bookingId: bookingReference,
      departureLocation,
      arrivalLocation,
      departDate,
      departTime,
      arriveDate,
      arriveTime,
      passengers: passengerCount,
      hasVehicle,
      vehicleType: hasVehicle && vehicleDetail.length > 0 ? vehicleDetail[0]['carType'] || '' : '',
      status: 'active',
      shippingLine,
      departurePort: departureLocation, // Use departureLocation as port for now
      arrivalPort: arrivalLocation, // Use arrivalLocation as port for now
      payment: totalFare,
      isPaid: 'paid',
      bookingDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      isRoundTrip: false, // Default to one-way trip
      passengerDetails: passengers, // Add passenger details
      vehicleInfo: hasVehicle && vehicleDetail.length > 0 ? {
        vehicleType: vehicleDetail[0]['carType'] || '',
        plateNumber: vehicleDetail[0]['plateNumber'] || '',
        vehicleOwner: vehicleDetail[0]['vehicleOwner'] || ''
      } : undefined
    });

    await activebook.save();

    // Create notification for booking created
    try {
      const newNotification = new Notification({
        type: 'booking_created',
        title: 'Booking Confirmed',
        message: `Your trip from ${departureLocation} to ${arrivalLocation} on ${departDate} at ${departTime} has been confirmed.`,
        userId: user,
        additionalData: {
          bookingId: bookingReference,
          departureLocation: departureLocation,
          arrivalLocation: arrivalLocation,
          departDate: departDate,
          departTime: departTime,
          actionRequired: false,
        },
        createdAt: new Date(),
        isRead: false
      });

      await newNotification.save();
      console.log(`✅ Booking created notification created for user ${user}`);
    } catch (notificationErr) {
      console.error('⚠️ Failed to create booking notification:', notificationErr);
      // Don't fail the main operation if notification fails
    }

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

    // Create notification for card creation
    try {
      const newNotification = new Notification({
        type: 'card_linked',
        title: 'Card Created',
        message: `Your new ${type} card has been created successfully.`,
        userId: userId,
        additionalData: {
          cardType: type,
          cardNumber: cardNumber,
          actionRequired: false,
        },
        createdAt: new Date(),
        isRead: false
      });

      await newNotification.save();
      console.log(`✅ Card created notification created for user ${userId}`);
    } catch (notificationErr) {
      console.error('⚠️ Failed to create card created notification:', notificationErr);
      // Don't fail the main operation if notification fails
    }

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

    // Create notification for card linking
    try {
      const newNotification = new Notification({
        type: 'card_linked',
        title: 'Card Linked',
        message: `Your ${updatedCard.type} card ending in ${cardNumber.substring(cardNumber.length - 4)} has been linked successfully.`,
        userId: updatedCard.userId,
        additionalData: {
          cardType: updatedCard.type,
          cardNumber: cardNumber,
          actionRequired: false,
        },
        createdAt: new Date(),
        isRead: false
      });

      await newNotification.save();
      console.log(`✅ Card linked notification created for user ${updatedCard.userId}`);
    } catch (notificationErr) {
      console.error('⚠️ Failed to create card linked notification:', notificationErr);
      // Don't fail the main operation if notification fails
    }

    res.status(201).json(updatedCard);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update card' });
  }
});

// ===== NOTIFICATION ROUTES =====

// Create a new notification
router.post('/notifications', async (req, res) => {
  try {
    const { type, title, message, userId, additionalData } = req.body;

    // Validate required fields
    if (!type || !title || !message || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create new notification
    const newNotification = new Notification({
      type,
      title,
      message,
      userId,
      additionalData: additionalData || {},
      createdAt: new Date(),
      isRead: false
    });

    await newNotification.save();

    console.log(`✅ Notification created: ${title} for user ${userId}`);

    res.status(201).json({
      message: 'Notification created successfully',
      notification: {
        id: newNotification._id,
        type: newNotification.type,
        title: newNotification.title,
        message: newNotification.message,
        userId: newNotification.userId,
        createdAt: newNotification.createdAt,
        isRead: newNotification.isRead
      }
    });
  } catch (err) {
    console.error('❌ Error creating notification:', err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Get all notifications for a user (excluding archived)
router.get('/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get notifications for the user (excluding archived), sorted by creation date (newest first)
    const notifications = await Notification.find({ 
      userId, 
      isArchived: { $ne: true } 
    })
      .sort({ createdAt: -1 })
      .limit(100); // Limit to prevent overwhelming response

    console.log(`🔍 Fetched ${notifications.length} active notifications for user ${userId}`);

    res.status(200).json(notifications);
  } catch (err) {
    console.error('❌ Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find and update the notification
    const updatedNotification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: userId },
      { isRead: true },
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log(`✅ Notification ${notificationId} marked as read for user ${userId}`);

    res.status(200).json({
      message: 'Notification marked as read',
      notification: updatedNotification
    });
  } catch (err) {
    console.error('❌ Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Archive notification (mark as archived instead of deleting)
router.put('/notifications/:notificationId/archive', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find and update the notification
    const updatedNotification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: userId },
      { isArchived: true },
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log(`📦 Notification ${notificationId} archived for user ${userId}`);

    res.status(200).json({
      message: 'Notification archived successfully',
      notification: updatedNotification
    });
  } catch (err) {
    console.error('❌ Error archiving notification:', err);
    res.status(500).json({ error: 'Failed to archive notification' });
  }
});

// Delete a notification
router.delete('/notifications/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find and delete the notification
    const deletedNotification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: userId
    });

    if (!deletedNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log(`🗑️ Notification ${notificationId} deleted for user ${userId}`);

    res.status(200).json({
      message: 'Notification deleted successfully',
      deletedNotification: deletedNotification
    });
  } catch (err) {
    console.error('❌ Error deleting notification:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get archived notifications for a user (notification history)
router.get('/notifications/:userId/archived', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get archived notifications for the user, sorted by creation date (newest first)
    const archivedNotifications = await Notification.find({ 
      userId, 
      isArchived: true 
    })
      .sort({ createdAt: -1 })
      .limit(100); // Limit to prevent overwhelming response

    console.log(`📦 Fetched ${archivedNotifications.length} archived notifications for user ${userId}`);

    res.status(200).json(archivedNotifications);
  } catch (err) {
    console.error('❌ Error fetching archived notifications:', err);
    res.status(500).json({ error: 'Failed to fetch archived notifications' });
  }
});

// Get unread notification count for a user
router.get('/notifications/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Count unread notifications (excluding archived)
    const unreadCount = await Notification.countDocuments({
      userId: userId,
      isRead: false,
      isArchived: { $ne: true }
    });

    console.log(`🔍 User ${userId} has ${unreadCount} unread notifications`);

    res.status(200).json({ unreadCount });
  } catch (err) {
    console.error('❌ Error getting unread count:', err);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// ===== END NOTIFICATION ROUTES =====

// ===== ANNOUNCEMENT ROUTES =====

// Create a new announcement
router.post('/announcements', async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      scheduleAffected,
      status,
      author,
      targetUsers,
      priority,
      expiresAt
    } = req.body;

    // Validate required fields
    if (!title || !message || !author) {
      return res.status(400).json({ error: 'Title, message, and author are required' });
    }

    // Create new announcement
    const announcement = new Announcement({
      title,
      message,
      type: type || 'general',
      scheduleAffected: scheduleAffected || '',
      status: status || 'draft',
      author,
      targetUsers: targetUsers || [],
      priority: priority || 'medium',
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    await announcement.save();

    console.log(`📢 Announcement created: ${title} by ${author}`);

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: announcement
    });
  } catch (err) {
    console.error('❌ Error creating announcement:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Get all active announcements for a user
router.get('/announcements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, priority } = req.query;

    // Validate user ID
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Build query for active announcements
    let query = {
      status: 'sent',
      isActive: true,
      $or: [
        { targetUsers: { $size: 0 } }, // Empty array means all users
        { targetUsers: userId }
      ]
    };

    // Add type filter if specified
    if (type) {
      query.type = type;
    }

    // Add priority filter if specified
    if (priority) {
      query.priority = priority;
    }

    // Get announcements that are currently active and not expired
    const announcements = await Announcement.find(query)
      .sort({ priority: -1, dateCreated: -1 })
      .limit(50);

    // Filter to only currently active announcements (not expired)
    const activeAnnouncements = announcements.filter(announcement => {
      if (announcement.isExpired) return false;
      return true;
    });

    console.log(`📢 Fetched ${activeAnnouncements.length} active announcements for user ${userId}`);

    res.status(200).json(activeAnnouncements);
  } catch (err) {
    console.error('❌ Error fetching announcements:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Mark announcement as read by user
router.put('/announcements/:announcementId/read', async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { userId } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find and update the announcement
    const announcement = await Announcement.findById(announcementId);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Mark as read
    await announcement.markAsRead(userId);

    console.log(`✅ Announcement ${announcementId} marked as read by user ${userId}`);

    res.status(200).json({
      message: 'Announcement marked as read',
      announcement: announcement
    });
  } catch (err) {
    console.error('❌ Error marking announcement as read:', err);
    res.status(500).json({ error: 'Failed to mark announcement as read' });
  }
});

// Get announcement statistics (admin only)
router.get('/announcements/stats/overview', async (req, res) => {
  try {
    const totalAnnouncements = await Announcement.countDocuments();
    const activeAnnouncements = await Announcement.countDocuments({ 
      status: 'sent', 
      isActive: true 
    });
    const urgentAnnouncements = await Announcement.countDocuments({ 
      status: 'sent', 
      isActive: true, 
      priority: 'critical' 
    });

    const stats = {
      total: totalAnnouncements,
      active: activeAnnouncements,
      urgent: urgentAnnouncements,
      lastUpdated: new Date()
    };

    console.log(`📊 Announcement stats: ${JSON.stringify(stats)}`);

    res.status(200).json(stats);
  } catch (err) {
    console.error('❌ Error fetching announcement stats:', err);
    res.status(500).json({ error: 'Failed to fetch announcement stats' });
  }
});

// Update announcement status
router.put('/announcements/:announcementId/status', async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { status, isActive } = req.body;

    // Validate required fields
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Find and update the announcement
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      announcementId,
      { 
        status,
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true }
    );

    if (!updatedAnnouncement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    console.log(`📢 Announcement ${announcementId} status updated to ${status}`);

    res.status(200).json({
      message: 'Announcement status updated successfully',
      announcement: updatedAnnouncement
    });
  } catch (err) {
    console.error('❌ Error updating announcement status:', err);
    res.status(500).json({ error: 'Failed to update announcement status' });
  }
});

// ===== END ANNOUNCEMENT ROUTES =====

// ===== ABOUT TEXT ROUTES =====

// Get about text
router.get('/about', async (req, res) => {
  try {
    let aboutData = await About.getLatest();
    
    if (!aboutData) {
      // Create default about text if none exists
      aboutData = await About.upsertAbout(
        "ECBARKO is a mobile application designed to enhance the convenience and efficiency of sea travel for passengers and ferry operators alike. With a user-friendly interface, the app allows travelers to browse updated ferry schedules, secure reservations, and receive instant notifications on trip changes or delays. ECBARKO also offers helpful travel tips, terminal information, and digital ticketing features to eliminate long queues and paperwork. By integrating modern technology into maritime travel, ECBARKO brings safety, transparency, and ease right to your fingertips—ensuring that every journey is smooth, timely, and stress-free.",
        'System',
        'Default about text created automatically'
      );
    }

    console.log('📖 About text fetched successfully');
    res.status(200).json(aboutData);
  } catch (err) {
    console.error('❌ Error fetching about text:', err);
    res.status(500).json({ error: 'Failed to fetch about text' });
  }
});

// Update about text (admin only)
router.put('/about', async (req, res) => {
  try {
    const { aboutText, author, notes } = req.body;

    // Validate required fields
    if (!aboutText) {
      return res.status(400).json({ error: 'About text is required' });
    }

    // Update or create about text
    const updatedAbout = await About.upsertAbout(
      aboutText,
      author || 'Admin',
      notes || ''
    );

    console.log('📖 About text updated successfully');

    res.status(200).json({
      message: 'About text updated successfully',
      about: updatedAbout
    });
  } catch (err) {
    console.error('❌ Error updating about text:', err);
    res.status(500).json({ error: 'Failed to update about text' });
  }
});

// ===== END ABOUT TEXT ROUTES =====


module.exports = router;
