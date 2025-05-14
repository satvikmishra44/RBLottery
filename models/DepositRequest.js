const mongoose = require("mongoose");

const DepositSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    email: {type: String, required: true},
    amount: {type: Number, required: true},
    utr: {type: String, required: true},
    status: {type: String, default: "pending"},
    createdAt: {type: Date, default: Date.now}
})

module.exports  = mongoose.model("DepositRequest", DepositSchema);