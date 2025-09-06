const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Email configuration
const EMAIL_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  timeout: 30000, // 30 seconds
  maxRecipients: 10,
  allowedDomains: ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'], // Add more as needed
  companyInfo: {
    name: 'ECBARKO',
    logo: '🚢',
    website: 'https://ecbarko.com',
    supportEmail: 'support@ecbarko.com',
    phone: '+63 XXX XXX XXXX'
  }
};

// Enhanced transporter with better error handling
const transporter = nodemailer.createTransport({
  service: "gmail",
  debug: true,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Add timeout and connection settings
  connectionTimeout: EMAIL_CONFIG.timeout,
  greetingTimeout: EMAIL_CONFIG.timeout,
  socketTimeout: EMAIL_CONFIG.timeout,
  // Rate limiting
  rateLimit: 5, // max 5 emails per second
  rateDelta: 1000, // per second
});

// Utility function to validate email format and domain
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  const domain = email.split('@')[1];
  if (!EMAIL_CONFIG.allowedDomains.includes(domain)) {
    console.warn(`⚠️ Email domain ${domain} is not in the allowed list`);
  }
  
  return true;
};

// Utility function to check email deliverability
const checkEmailDeliverability = async (email) => {
  try {
    // Basic MX record check (simplified)
    const domain = email.split('@')[1];
    const dns = require('dns').promises;
    
    try {
      await dns.resolveMx(domain);
      return { deliverable: true, domain };
    } catch (error) {
      return { deliverable: false, domain, error: error.message };
    }
  } catch (error) {
    return { deliverable: false, error: error.message };
  }
};

// Retry mechanism for email sending
const sendEmailWithRetry = async (mailOptions, maxRetries = EMAIL_CONFIG.maxRetries) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verify transporter is ready
      await transporter.verify();
      
      // Send the email
      const result = await transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent successfully on attempt ${attempt}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, EMAIL_CONFIG.retryDelay * attempt));
    }
  }
};

// Send OTP
const sendOtpEmail = async (email, otp) => {
  // Validate email format
  validateEmail(email);

  // Validate OTP format (assuming 6-digit numeric OTP)
  if (!/^\d{6}$/.test(otp)) {
    throw new Error('Invalid OTP format');
  }

  const currentTime = new Date().toLocaleString('en-PH', { 
    timeZone: 'Asia/Manila' 
  });
  
  const mailOptions = {
    from: `"${EMAIL_CONFIG.companyInfo.name}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Your ECBARKO Verification Code',
    text: `Your ECBARKO verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nECBARKO Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ECBARKO Verification Code</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #007bff; 
            padding-bottom: 20px;
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #007bff; 
            margin-bottom: 10px;
          }
          .otp-container { 
            text-align: center; 
            margin: 30px 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            color: white;
          }
          .otp-code { 
            font-size: 36px; 
            font-weight: bold; 
            letter-spacing: 8px; 
            margin: 20px 0;
            font-family: 'Courier New', monospace;
          }
          .expiry { 
            background: #fff3cd; 
            color: #856404; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0;
            border-left: 4px solid #ffc107;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
            color: #666; 
            font-size: 14px;
          }
          .security-note { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0;
            border-left: 4px solid #28a745;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${EMAIL_CONFIG.companyInfo.logo} ${EMAIL_CONFIG.companyInfo.name}</div>
            <h2>Verification Code</h2>
          </div>
          
          <p>Hello!</p>
          <p>You've requested a verification code for your ${EMAIL_CONFIG.companyInfo.name} account. Here's your code:</p>
          
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
            <p>Enter this code to verify your account</p>
          </div>
          
          <div class="expiry">
            ⏰ <strong>Important:</strong> This code will expire in <strong>10 minutes</strong> for security reasons.
          </div>
          
          <div class="security-note">
            🔒 <strong>Security Note:</strong> Never share this code with anyone. ${EMAIL_CONFIG.companyInfo.name} staff will never ask for your verification code.
          </div>
          
          <p>If you didn't request this verification code, please:</p>
          <ul>
            <li>Ignore this email</li>
            <li>Check your account security settings</li>
            <li>Contact our support team if you have concerns</li>
          </ul>
          
          <p>Best regards,<br><strong>${EMAIL_CONFIG.companyInfo.name} Team</strong></p>
          
          <div class="footer">
            <p>This email was sent on ${currentTime}</p>
            <p>© ${new Date().getFullYear()} ${EMAIL_CONFIG.companyInfo.name}. All rights reserved.</p>
            <p>Need help? Contact us at <a href="mailto:${EMAIL_CONFIG.companyInfo.supportEmail}">${EMAIL_CONFIG.companyInfo.supportEmail}</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    // Check email deliverability
    const deliverability = await checkEmailDeliverability(email);
    if (!deliverability.deliverable) {
      console.warn(`⚠️ Email deliverability warning for ${email}: ${deliverability.error}`);
    }

    // Send email with retry mechanism
    const result = await sendEmailWithRetry(mailOptions);
    
    console.log(`✅ OTP email sent successfully to ${email}`);
    console.log(`📧 Message ID: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
      recipient: email,
      deliverability
    };
    
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    
    // Enhanced error logging
    const errorDetails = {
      error: error.message,
      code: error.code,
      command: error.command,
      recipient: email,
      timestamp: new Date().toISOString()
    };
    
    console.error('Error details:', errorDetails);
    
    // Re-throw with more context
    throw new Error(`Failed to send OTP email to ${email}: ${error.message}`);
  }
};

// Send Password Reset
const sendResetEmail = async (email, reset) => {
  // Validate email format
  validateEmail(email);

  // Validate reset link
  if (!reset || typeof reset !== 'string') {
    throw new Error('Invalid reset link');
  }

  const currentTime = new Date().toLocaleString('en-PH', { 
    timeZone: 'Asia/Manila' 
  });

  const mailOptions = {
    from: `"${EMAIL_CONFIG.companyInfo.name}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔑 Reset Your ECBARKO Password',
    text: `Hello!\n\nYou've requested to reset your ECBARKO password. Click the link below to reset it:\n\n${reset}\n\nThis link will expire in 1 hour for security reasons.\n\nIf you didn't request this password reset, please ignore this email.\n\nBest regards,\nECBARKO Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ECBARKO Password Reset</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #dc3545; 
            padding-bottom: 20px;
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #dc3545; 
            margin-bottom: 10px;
          }
          .reset-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 25px; 
            font-weight: bold; 
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
          }
          .expiry { 
            background: #fff3cd; 
            color: #856404; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0;
            border-left: 4px solid #ffc107;
          }
          .security-note { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0;
            border-left: 4px solid #28a745;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
            color: #666; 
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${EMAIL_CONFIG.companyInfo.logo} ${EMAIL_CONFIG.companyInfo.name}</div>
            <h2>Password Reset Request</h2>
          </div>
          
          <p>Hello!</p>
          <p>You've requested to reset your ${EMAIL_CONFIG.companyInfo.name} account password. Click the button below to proceed:</p>
          
          <div style="text-align: center;">
            <a href="${reset}" class="reset-button">Reset My Password</a>
          </div>
          
          <p style="text-align: center; margin-top: 20px;">
            <small>Or copy and paste this link in your browser:</small><br>
            <a href="${reset}" style="word-break: break-all; color: #007bff;">${reset}</a>
          </p>
          
          <div class="expiry">
            ⏰ <strong>Important:</strong> This reset link will expire in <strong>1 hour</strong> for security reasons.
          </div>
          
          <div class="security-note">
            🔒 <strong>Security Note:</strong> Never share this link with anyone. ${EMAIL_CONFIG.companyInfo.name} staff will never ask for your password or send password reset links.
          </div>
          
          <p>If you didn't request this password reset, please:</p>
          <ul>
            <li>Ignore this email</li>
            <li>Check your account security settings</li>
            <li>Contact our support team if you have concerns</li>
          </ul>
          
          <p>Best regards,<br><strong>${EMAIL_CONFIG.companyInfo.name} Team</strong></p>
          
          <div class="footer">
            <p>This email was sent on ${currentTime}</p>
            <p>© ${new Date().getFullYear()} ${EMAIL_CONFIG.companyInfo.name}. All rights reserved.</p>
            <p>Need help? Contact us at <a href="mailto:${EMAIL_CONFIG.companyInfo.supportEmail}">${EMAIL_CONFIG.companyInfo.supportEmail}</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    // Check email deliverability
    const deliverability = await checkEmailDeliverability(email);
    if (!deliverability.deliverable) {
      console.warn(`⚠️ Email deliverability warning for ${email}: ${deliverability.error}`);
    }

    // Send email with retry mechanism
    const result = await sendEmailWithRetry(mailOptions);
    
    console.log(`✅ Password reset email sent successfully to ${email}`);
    console.log(`📧 Message ID: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
      recipient: email,
      deliverability
    };
    
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    
    // Enhanced error logging
    const errorDetails = {
      error: error.message,
      code: error.code,
      command: error.command,
      recipient: email,
      timestamp: new Date().toISOString()
    };
    
    console.error('Error details:', errorDetails);
    
    // Re-throw with more context
    throw new Error(`Failed to send password reset email to ${email}: ${error.message}`);
  }
};

const sendPDFEmail = async ({
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
  totalFare,
}) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    let buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      const mailOptions = {
        from: `"${EMAIL_CONFIG.companyInfo.name}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Your E-Ticket (${bookingReference})`,
        text: 'Please find your e-ticket attached.',
        attachments: [{
          filename: `E-Ticket-${bookingReference}.pdf`,
          content: pdfData,
        }],
      };

      try {
        console.log('user',process.env.EMAIL_USER, process.env.EMAIL_PASS);
        await transporter.sendMail(mailOptions);
        console.log(`PDF e-ticket sent to ${email}`);
        resolve();
      } catch (error) {
        console.error('Error sending PDF email:', error);
        reject(error);
      }
    });

    // Header Section
    doc.rect(0, 0, 612, 60).fill('#1e40af'); // Blue header background
    
    // EcBarko White Logo (placeholder - would need actual image)
    doc.fillColor('white')
       .rect(30, 15, 30, 30)
       .fill();
    doc.fillColor('#1e40af')
       .fontSize(8)
       .text('ECB', 35, 25);
    
    // PPA Logo (placeholder - would need actual image)
    doc.fillColor('white')
       .rect(70, 15, 30, 30)
       .fill();
    doc.fillColor('#1e40af')
       .fontSize(8)
       .text('PPA', 75, 25);
    
    // EcBarko Text
    doc.fillColor('white')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('EcBarko', 110, 20);
    
    // Document title and date
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('eTicket Itinerary Receipt', 400, 15, { align: 'right' });
    
    // Format date properly
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }).toUpperCase();
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(formattedDate, 400, 35, { align: 'right' });
    
    doc.fontSize(10)
       .text('For complete booking experience Call +63 2 528 7000', 400, 50, { align: 'right' });

    // Reset to black for content
    doc.fillColor('black');
    
    // Main content area
    let yPosition = 80;
    
    // Company Information and Booking Details Row
    // Company Information (Left Side)
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Address:', 30, yPosition);
    yPosition += 15;
    
    doc.fontSize(10)
       .font('Helvetica')
       .text('Port Operations Building', 30, yPosition);
    yPosition += 12;
    doc.text('Barangay Talao-Talao, Port Area', 30, yPosition);
    yPosition += 12;
    doc.text('Lucena City, Quezon Province', 30, yPosition);
    yPosition += 12;
    doc.text('4301 Philippines', 30, yPosition);
    yPosition += 15;
    
    doc.text('TIN: 000-123-456-000000 VAT', 30, yPosition);
    yPosition += 30;

    // Booking Details (Right Side)
    let rightY = 80;
    
    // Left column of booking details
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Booking Reference No.:', 350, rightY);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#1e40af')
       .text(bookingReference, 350, rightY + 12);
    doc.fillColor('black');
    rightY += 30;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Departure:', 350, rightY);
    
    // Format departure date and time properly
    const formattedDepartDate = new Date(departDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }).toUpperCase();
    
    // Format time to 12-hour format
    let formattedDepartTime = departTime;
    if (!departTime.includes('AM') && !departTime.includes('PM')) {
      const [hours, minutes] = departTime.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : (hour24 > 12 ? hour24 - 12 : hour24);
      const period = hour24 >= 12 ? 'PM' : 'AM';
      formattedDepartTime = `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
    }
    
    doc.fontSize(11)
       .font('Helvetica')
       .text(`${departureLocation} ${formattedDepartDate} | ${formattedDepartTime}`, 350, rightY + 12);
    rightY += 25;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Schedule No.:', 350, rightY);
    doc.fontSize(11)
       .font('Helvetica')
       .text('SCHED#000', 350, rightY + 12);
    rightY += 25;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Contact Number:', 350, rightY);
    doc.fontSize(11)
       .font('Helvetica')
       .text(passengers[0]?.contact || 'N/A', 350, rightY + 12);
    rightY += 30;

    // Right column of booking details
    rightY = 80;
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Shipping Line:', 500, rightY);
    doc.fontSize(11)
       .font('Helvetica')
       .text(shippingLine, 500, rightY + 12);
    rightY += 25;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Destination:', 500, rightY);
    doc.fontSize(11)
       .font('Helvetica')
       .text(arrivalLocation, 500, rightY + 12);
    rightY += 25;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Vehicles:', 500, rightY);
    doc.fontSize(11)
       .font('Helvetica')
       .text(hasVehicle ? `${vehicleDetail.length} Vehicle(s)` : 'NONE', 500, rightY + 12);
    rightY += 25;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Email:', 500, rightY);
    doc.fontSize(11)
       .font('Helvetica')
       .text('passenger@email.com', 500, rightY + 12);

    yPosition = 200;

    // Passenger and Fare Details Table
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Passenger and Fare Details', 30, yPosition);
    yPosition += 25;
    
    // Table Header
    doc.rect(30, yPosition, 552, 20).fill('#e5e7eb').stroke('#9ca3af');
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('black')
       .text('Passenger Name', 40, yPosition + 6);
    doc.text('Type', 350, yPosition + 6);
    doc.text('Amount (PHP)', 450, yPosition + 6);
    yPosition += 25;
    
    // Table Rows
    passengers.forEach((passenger, index) => {
      doc.rect(30, yPosition, 552, 20)
         .stroke('#9ca3af')
         .fill(index % 2 === 0 ? 'white' : '#f9fafb');
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('black')
         .text(passenger.name || 'N/A', 40, yPosition + 6);
      doc.text('Adult', 350, yPosition + 6);
      doc.text(`₱${(totalFare / passengers.length).toFixed(2)}`, 450, yPosition + 6);
      
      yPosition += 25;
    });
    
    // Total Row
    doc.rect(30, yPosition, 552, 20).fill('#f3f4f6').stroke('#9ca3af');
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('black')
       .text('TOTAL PASSENGER FARE:', 40, yPosition + 6);
    doc.text(`₱${totalFare.toFixed(2)}`, 450, yPosition + 6);
    yPosition += 40;

    // Summary of Charges
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Summary of Charges', 30, yPosition);
    yPosition += 25;
    
    doc.fontSize(11)
       .font('Helvetica')
       .text('Terminal Fee:', 30, yPosition);
    doc.text('₱30.00', 500, yPosition, { align: 'right' });
    yPosition += 15;
    
    doc.text('Vehicle Fee:', 30, yPosition);
    doc.text(hasVehicle ? '₱625.73' : '₱0.00', 500, yPosition, { align: 'right' });
    yPosition += 20;
    
    // Divider line
    doc.moveTo(30, yPosition).lineTo(582, yPosition).stroke('#9ca3af');
    yPosition += 15;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('TOTAL AMOUNT DUE:', 30, yPosition);
    doc.text(`₱${(totalFare + 30.00 + (hasVehicle ? 625.73 : 0.00)).toFixed(2)}`, 500, yPosition, { align: 'right' });
    yPosition += 40;

    // Reminders Box
    doc.rect(30, yPosition, 552, 60).fill('#dbeafe').stroke('#3b82f6');
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#1e40af')
       .text('Reminders', 40, yPosition + 10);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#1e40af')
       .text('• Be in the terminal 4 hours prior to departure.', 40, yPosition + 25);
    doc.text('• All passengers must present a valid identification at the terminal together with this eTicket Itinerary Receipt.', 40, yPosition + 37);
    doc.text('• Tickets cannot be changed for refunded and/or revalidated tickets after vessel departure.', 40, yPosition + 49);
    yPosition += 80;

    // Terms and Conditions
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('black')
       .text('Terms and Conditions', 30, yPosition);
    yPosition += 20;
    
    doc.fontSize(9)
       .font('Helvetica')
       .text('• Non-transferable ticket valid only for named passengers and specified schedule.', 30, yPosition);
    yPosition += 12;
    doc.text('• Check-in 4 hours before departure with valid ID.', 30, yPosition);
    yPosition += 12;
    doc.text('• No refunds for no-shows or after departure.', 30, yPosition);
    yPosition += 12;
    doc.text('• Cancellations require 24-hour notice.', 30, yPosition);
    yPosition += 12;
    doc.text('• EcBarko not liable for personal belongings, delays, or weather-related changes.', 30, yPosition);
    yPosition += 12;
    doc.text('• Passengers must comply with safety regulations.', 30, yPosition);
    yPosition += 12;
    doc.text('• By purchasing, you agree to all terms under Philippine maritime law.', 30, yPosition);
    yPosition += 30;

    // Footer
    doc.fontSize(9)
       .font('Helvetica')
       .text('This e-ticket serves as proof of purchase and booking confirmation.', 30, yPosition);
    yPosition += 12;
    doc.text('Please retain this document for your records and present it at the terminal for boarding.', 30, yPosition);
    yPosition += 12;
    doc.text('For inquiries, contact EcBarko customer service at +63 2 528 7000 or visit our office at Port Operations Building, Barangay Talao-Talao, Port Area, Lucena City, Quezon Province.', 30, yPosition);
    yPosition += 30;
    
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#1e40af')
       .text('Thank you for choosing EcBarko. Safe travels!', 30, yPosition, { align: 'center' });

    // Vehicle details section (if needed)
    if (hasVehicle && Array.isArray(vehicleDetail)) {
      yPosition += 10;
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Vehicle Details', 50, yPosition);
      yPosition += 25;
      
      vehicleDetail.forEach((v, i) => {
        doc.rect(50, yPosition, 500, 50)
           .stroke('#e5e7eb')
           .fill('#f0f9ff');
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`Vehicle ${i + 1}:`, 60, yPosition + 10);
        doc.font('Helvetica')
           .text(`Plate Number: ${v.plateNumber}`, 60, yPosition + 25);
        doc.text(`Car Type: ${v.carType}`, 60, yPosition + 40);
        doc.text(`Driver: ${v.vehicleOwner}`, 300, yPosition + 25);
        
        yPosition += 60;
      });
    }

    // Total fare section with emphasis
    yPosition += 20;
    doc.rect(50, yPosition, 500, 40)
       .fill('#1e40af');
    
    doc.fillColor('white')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Total Fare:', 60, yPosition + 15);
    doc.fontSize(20)
       .text(`₱${totalFare}`, 200, yPosition + 12);

    // Footer
    yPosition += 60;
    doc.fillColor('black')
       .fontSize(10)
       .font('Helvetica')
       .text('Thank you for choosing ECBarko!', 50, yPosition, { align: 'center' });
    doc.text('Safe travels!', 50, yPosition + 15, { align: 'center' });
    
    // Add some decorative elements
    doc.strokeColor('#1e40af')
       .lineWidth(2)
       .moveTo(50, 90)
       .lineTo(550, 90)
       .stroke();

    doc.end();
  });
};

module.exports = {
  sendOtpEmail,
  sendResetEmail,
  sendPDFEmail,
  validateEmail,
  checkEmailDeliverability,
  sendEmailWithRetry,
  EMAIL_CONFIG,
};
