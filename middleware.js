const jwt = require('jsonwebtoken');
const User = require('./models/User');
const secret = process.env.JWT_TOKEN || 'RBLotteryToken1234'

exports.protect = async(req, res, next) => {
    const auth = req.headers.authorization;
    if(!auth?.startsWith('Bearer ')) {
        return res.status(401).json({message: 'Not Authorised for accessing this information'})
    }

    try{
        const token = auth.split(' ')[1];
        const {id, role} = jwt.verify(token, secret);
        req.user = await User.findById(id).select('-password');
        next();
    } catch {
        res.status.json({message: 'Token Invalid'})
    }
}

exports.adminOnly = (req, res, next) => {
    if(req.user.role != 'admin'){
        return res.status(403).json({message: 'Admin Only'})
    }
    next();
};