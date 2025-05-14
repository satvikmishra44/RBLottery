const DepositRequest = require('../models/DepositRequest');
const WithdrawRequest = require('../models/WithdrawalRequest');
const User = require('../models/User');

exports.createDepositRequest = async(req, res) => {
    try{
        const {userId, email, amount, utr} = req.body; // Extract email from request body
        if(amount < 50){
            return res.status(400).json({message: "Minimum deposit amount is 50"});
        }
        const depositRequest = new DepositRequest({userId, email, amount, utr, status:"pending"}); // Include email in the deposit request
        await depositRequest.save();
        res.json({success: true, message: "Deposit request submitted"});
    } catch(err){
        console.error("Error Creating Deposit Request: ", err);
        res.status(500).json({success: false, message: "Error creating deposit request"});
    }
}

exports.getUserDepositRequests = async(req, res) => {
    try{
        const {id: userId} = req.params;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        const requests = await DepositRequest.find({ userId }).populate("userId", "email balance bonusW createdAt");
        res.json(requests);

    } catch(err){
        res.status(500).json({message: "Server Error"});
    }
};

exports.createWithdrawalRequest = async(req, res) => {
    try{
        const {userId, email, amount, bank, ifsc} = req.body;
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({success: false, message: "User not found"});
        }

        if(user.cash < amount){
            return res.status(400).json({success: false, message: "Insufficient balance"})
        }

        user.cash -= amount;

        await user.save();

        const newWithdrawal = new WithdrawRequest({userId, email, amount, bank, ifsc, status:"pending"});
        await newWithdrawal.save();

        res.json({success: true, message: "Withdrawal request sent"});
    } catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error"});
    }
}

exports.getUserWithdraw = async (req, res) => {
    try{
        const {id: userId} = req.params;
        const requests = userId ? await WithdrawRequest.find({ userId }) : await WithdrawRequest.find();
        res.json(requests);
    } catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error"});
    }
}

exports.getUserHistory = async (req, res) => {
    try {
      const { id: userId } = req.params;
      if (!userId) return res.status(400).json({ message: 'User ID is required' });
  
      const user = await User.findById(userId).select('history').lean();
  
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      res.json(user.history);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };