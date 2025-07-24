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

const mongoURI = "mongodb+srv://edsonpaul98:edsonpaul@cluster0.jnayloj.mongodb.net/ecbarko-web-portal?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});