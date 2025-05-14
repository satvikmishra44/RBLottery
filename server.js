const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require("dotenv").config();
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Auth Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Admin Routes
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// Normal User Routes
const normalRoutes = require('./routes/normal');
app.use('/normal', normalRoutes)

// app.get("/", (req, res) => {
//     res.send("Server Running");
// });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    });

    app.get('/', (req, res) => {
        res.send("Betting Game Backend Running");
      });
      
      const options = {
        key: fs.readFileSync(path.join('/etc/letsencrypt/live/srv766762.hstgr.cloud/privkey.pem')),
        cert: fs.readFileSync(path.join('/etc/letsencrypt/live/srv766762.hstgr.cloud/fullchain.pem')),
      };
      
      // Create HTTPS Server
      https.createServer(options, app).listen(PORT, () => {
        console.log(`HTTPS Srver Running On Port ${PORT}`);
      });