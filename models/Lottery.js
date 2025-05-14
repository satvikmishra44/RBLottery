const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    number: {type: Number, required: true},
    won: {type: Number, default: 0}
});

const LotterySchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    fees: {type: Number, required: true},
    prize: {type: Number, required: true},
    participants: [ParticipantSchema],
    status: {type: String, enum: ['active', 'past'], default: 'active'},
    duration: {type: Number, required: true},
    endTime: {type: Date, required: true},
    max: {type:Number, required: true},
    rules: {type: String},
    winner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    winamount: {type: Number, required: true},
    winnerNumber: {type: Number},
    distributed: {type: Boolean, default: false},
    completedDate: Date
}, {timestamps: true});

module.exports = mongoose.model('Lottery', LotterySchema);