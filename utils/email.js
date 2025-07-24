const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  debug: true,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send OTP
const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'ECBARKO OTP',
    text: `Your OTP code is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP:', error);
  }
};

// Send Password Reset
const sendResetEmail = async (email, reset) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'ECBARKO Email Reset',
    text: `Your reset link: ${reset}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending reset email:', error);
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
        from: process.env.EMAIL_USER,
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
};
