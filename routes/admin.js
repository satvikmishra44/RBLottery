const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/LotteryController')
const User = require('../models/User');
const withdrawals = require('../models/WithdrawalRequest')
const deposits = require('../models/DepositRequest')
router.post('/create', ctrl.create);
router.get('/rounds', ctrl.adminList);
router.get('/round/:id', ctrl.adminRound);
router.post('/round/:id/payouts', ctrl.savePayouts);

// Get All Users
router.get("/users", async(req, res)=> {
    try{
        const users = await User.find().select("-password");
        res.json(users);
    } catch(err){
        console.log(err);
        res.status(500).json({message:"Error Fetching Users"});
    }
})

// Get All Withdrawal Requests
router.get("/withdrawRequests", async(req, res) => {
    try{
        const requests = await withdrawals.find().populate("userId", "email balance bonusW");
        res.json(requests);
    } catch(err){
        console.log(err);
        res.status(500).json({message:"Error Fetching Withdrawal Requests"});
    }
})

// Get All Deposit Requests
router.get("/deposits", async(req, res) => {
    try{
        const requests = await deposits.find().populate("userId", "email balance bonusW");
        res.json(requests);
    } catch(err){
        console.log(err);
        res.status(500).json({message:"Error Fetching Deposit Requests"});
    }
})

// Approve Or Reject Withdrawal Request
router.patch("/withdrawals/:userId", async(req, res) => {
    try{
        const {status} = req.body;
        const {userId} = req.params;
        const request = await withdrawals.findById(userId);
        if(!request){
            return res.status(404).json({message:"Withdrawal Request Not Found"});
        }

        if(status === "rejected"){ 
            console.log(`Reverting balance for userId: ${request.userId}, Amount: ${request.amount}`);

            await User.findByIdAndUpdate(request.userId, {$inc: {cash: request.amount}});
        }
        
        request.status = status;
        await request.save();
        res.json({success:true, message:`Withdrawal ${status}`});
    } catch(err){
        console.log(err);
        res.status(500).json({message:"Error Fetching Withdrawal Request"});
    }
})

// Approving Or Rejecting Deposit Requests

router.patch("/deposits/:id", async(req, res) => {

    try{
        const {status} = req.body;
        const {id: userId} = req.params;
        const request = await deposits.findById(userId);
        if(!request){
            return res.status(404).json({message:"Deposit Request Not Found"});
        }
        if(status === "approved"){
            await User.findByIdAndUpdate(request.userId, {$inc: {bonus: request.amount}});
            await User.findByIdAndUpdate(request.userId, {betsCount: 0});
        }

        request.status = status;
        await request.save();
        res.json({success:true, message:`Deposit ${status}`});
    } catch(err){
        console.log(err);
        res.status(500).json({message:"Error Fetching Deposit Request"});
    }
})

module.exports = router;
