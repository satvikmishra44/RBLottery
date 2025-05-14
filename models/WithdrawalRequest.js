const mongoose = require('mongoose');

const withdrawSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    email: {type: String, required:true},
    amount: {type: Number, required: true},
    bank: {type: Number, required: true},
    ifsc: {type: String, required:true},
    status: {type: String, default: "pending"},
    createdAt: {type: Date, default: Date.now}
})

module.exports = mongoose.model("WithdrawRequest", withdrawSchema);