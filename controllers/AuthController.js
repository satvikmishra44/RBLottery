const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
require("dotenv").config();

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
  };
  
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
      user: process.env.EMAIL, // Your email
      pass: process.env.PASS, // Your email password
    },
  });
  
  const sendOTP = async (email, otp) => {
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'OTP For RBLottery Verification',
      text: `Your OTP code for verification of account is ${otp}. Make sure not to share this with anyone to avoid data breach.`,
    };
    await transporter.sendMail(mailOptions);
  };
  
  // In-memory storage for temporary user data
  const tempUserStorage = {};

exports.register = async (req, res) => {
    try{
        const {name, email, password} = req.body;
        const exist = await User.findOne({email});

        if(exist){
            console.log("Already");
            return res.status(400).json({message: 'Email already registered'});
        }

        const hashed = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        await sendOTP(email, otp); // Send OTP to user's email

        // Store temporary user data in memory
        tempUserStorage[email] = { email: email, password: `${hashed}`, name: name, otp };
        res.status(200).json({ message: 'OTP sent to email. Please enter the correct otp to complete registration.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const tempUser = tempUserStorage[email];

    if (!tempUser || tempUser.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP is valid, proceed to save the user to the database
    const newUser = new User(tempUser);
    await newUser.save();

    // Remove the temporary user data from memory
    delete tempUserStorage[email];

    res.status(200).json({ success: true, message: 'User registered successfully' });
    return true;
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err || 'Invalid OTP or Server Error' });
  }
};

exports.login = async (req, res) => {
    try {
    const {email, password} = req.body;
    const user = await User.findOne({email});

    if(!user){
        return res.status(400).json({message: 'Invalid User'});
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        return res.status(400).json({message: 'Invalid Password'});
    }

    const token = jwt.sign({id: user._id}, process.env.JWT_TOKEN, {expiresIn: '7d'});
    res.status(200).json({token: token,  userId: user._id, email: user.email, name: user.name, admin: user.isAdmin});
} catch(err){
    console.error(err);
    return res.status(500).json({message: err});
}
}