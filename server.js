require('dotenv').config();  
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
app.use(cors({
  origin: '*',  // Allows requests from any origin
}));
app.use(express.json());

const mongoURI = process.env.MONGODB_URI || "mongodb+srv://edsonpaul98:edsonpaul@cluster0.jnayloj.mongodb.net/ecbarko-web-portal?retryWrites=true&w=majority&appName=Cluster0";

// Add connection timeout and retry logic
mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 5000, // 5 second timeout
  connectTimeoutMS: 10000, // 10 second timeout
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
})
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit if DB connection fails
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Health check available at /health`);
});