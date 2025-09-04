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
        subject: `🚢 Your E-Ticket is Ready! (${bookingReference})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1e3a8a; margin: 0; font-size: 28px; font-weight: bold;">🚢 ECBARKO</h1>
                <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Your Ferry Booking Confirmation</p>
              </div>

              <!-- Success Message -->
              <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 25px; border-radius: 5px;">
                <h2 style="color: #065f46; margin: 0 0 10px 0; font-size: 20px;">✅ Booking Confirmed!</h2>
                <p style="color: #065f46; margin: 0; font-size: 16px; line-height: 1.5;">
                  Thank you for choosing ECBARKO! Your ferry booking has been successfully confirmed. 
                  Your e-ticket is attached to this email.
                </p>
              </div>

              <!-- Booking Details -->
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">📋 Booking Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <p style="margin: 8px 0; color: #6b7280;"><strong>Booking Reference:</strong></p>
                    <p style="margin: 8px 0; color: #1f2937; font-weight: bold; font-size: 16px;">${bookingReference}</p>
                  </div>
                  <div>
                    <p style="margin: 8px 0; color: #6b7280;"><strong>Route:</strong></p>
                    <p style="margin: 8px 0; color: #1f2937; font-weight: bold; font-size: 16px;">${departureLocation} ➝ ${arrivalLocation}</p>
                  </div>
                  <div>
                    <p style="margin: 8px 0; color: #6b7280;"><strong>Departure:</strong></p>
                    <p style="margin: 8px 0; color: #1f2937; font-weight: bold; font-size: 16px;">${departDate} at ${departTime}</p>
                  </div>
                  <div>
                    <p style="margin: 8px 0; color: #6b7280;"><strong>Arrival:</strong></p>
                    <p style="margin: 8px 0; color: #1f2937; font-weight: bold; font-size: 16px;">${arriveDate} at ${arriveTime}</p>
                  </div>
                  <div>
                    <p style="margin: 8px 0; color: #6b7280;"><strong>Shipping Line:</strong></p>
                    <p style="margin: 8px 0; color: #1f2937; font-weight: bold; font-size: 16px;">${shippingLine}</p>
                  </div>
                  <div>
                    <p style="margin: 8px 0; color: #6b7280;"><strong>Total Fare:</strong></p>
                    <p style="margin: 8px 0; color: #1f2937; font-weight: bold; font-size: 16px;">₱${totalFare}</p>
                  </div>
                </div>
              </div>

              <!-- Important Information -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 5px; margin-bottom: 25px;">
                <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">⚠️ Important Information</h3>
                <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.6;">
                  <li>Please arrive at the port at least 1 hour before departure</li>
                  <li>Bring a valid government-issued ID for verification</li>
                  <li>Present your e-ticket (printed or digital) at check-in</li>
                  <li>Keep your booking reference number handy</li>
                  <li>Check weather conditions before travel</li>
                </ul>
              </div>

              <!-- Contact Information -->
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📞 Need Help?</h3>
                <p style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">
                  If you have any questions or need assistance, please contact us:
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <p style="margin: 5px 0; color: #1e40af;"><strong>📧 Email:</strong></p>
                    <p style="margin: 5px 0; color: #1e40af;">support@ecbarko.com</p>
                  </div>
                  <div>
                    <p style="margin: 5px 0; color: #1e40af;"><strong>🌐 Website:</strong></p>
                    <p style="margin: 5px 0; color: #1e40af;">https://ecbarko.com</p>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0; font-size: 14px;">
                  Thank you for choosing ECBARKO for your journey! 🚢
                </p>
                <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">
                  This is an automated email. Please do not reply to this message.
                </p>
              </div>

            </div>
          </div>
        `,
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

    doc.fontSize(20).text('E-Ticket', { align: 'center' });
    doc.moveDown().fontSize(12);
    doc.text(`Booking Reference: ${bookingReference}`);
    doc.text(`Route: ${departureLocation} ➝ ${arrivalLocation}`);
    doc.text(`Departure: ${departDate} at ${departTime}`);
    doc.text(`Arrival: ${arriveDate} at ${arriveTime}`);
    doc.text(`Shipping Line: ${shippingLine}`);
    doc.text(`Card Type: ${selectedCardType}`);
    doc.moveDown().text(`Passengers:`);

    passengers.forEach(p => {
      doc.text(`• ${p.name} (Contact: ${p.contact})`);
    });

    if (hasVehicle && Array.isArray(vehicleDetail)) {
      doc.moveDown().text('Vehicle Details:');
      vehicleDetail.forEach((v, i) => {
        doc.text(`- Vehicle ${i + 1}:`);
        doc.text(`  • Plate Number: ${v.plateNumber}`);
        doc.text(`  • Car Type: ${v.carType}`);
        doc.text(`  • Driver: ${v.vehicleOwner}`);
      });
    }

    doc.text(`Total Fare: ₱${totalFare}`);
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
