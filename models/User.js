const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    title: {type: String, required: true},
    number: {type: Number, required: true},
    won: {type: Number},
    createdAt: {type: Date, default: Date.now}
});

const UserSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    cash: {type: Number, default: 0},
    bonus: {type: Number, default: 0},
    history: [HistorySchema],
    isAdmin: {type: Boolean, default: false}
});

const User = mongoose.model('User', UserSchema);

module.exports = User;