const Lottery = require('../models/Lottery');
const User = require('../models/User');

async function finalise(lot){
    if(lot.status !== 'active'){
        return lot;
    }
    if(new Date() < lot.endTime){
        return lot;
    }

    // Selecting A Winner If None Set
    const parts = lot.participants;
    if(lot.winningNumber === undefined || lot.winningNumber === null){
        if(parts.length){
            // Check if any participant has won > 0
            const maxWon = Math.max(...parts.map(p => p.won || 0));
            if(maxWon > 0){
                // Select participant with max won
                const winner = parts.reduce((maxP, p) => (p.won > (maxP.won || 0) ? p : maxP), parts[0]);
                lot.winner = winner.user;
                lot.winamount = winner.won;
                lot.winnerNumber = winner.number;
            } else {
                // Random winner if all won are 0
                const idx = Math.floor(Math.random() * parts.length);
                const winner = parts[idx];
                lot.winner = winner.user;
                winner.won = lot.winamount;
                lot.winnerNumber = winner.number;
            }
        }
    }

    for (const part of lot.participants) {
        if (part.won && part.won > 0) {
          await User.findByIdAndUpdate(part.user, { $inc: { cash: part.won } });
          await User.findByIdAndUpdate(part.user, {
            $push: {
              history: {
                user: part.user,
                title: lot.title,
                number: part.number,
                won: part.won,
              },
            },
          });
        }
      }
      
    lot.distributed = true;

    lot.status = 'past';
    lot.completedDate = new Date();
    await lot.save();
    return lot;
}

// Creating A Lottery

exports.create = async (req, res) => {
    const {title, fees, duration, prize, max, win, description} = req.body;
    const endTime = new Date(Date.now() + duration * 60000);
    try{
        const lot = await Lottery.create({title, fees, duration: duration, prize: prize, endTime: endTime, max: max, winamount: win, description: description});
        res.json(lot);
    } catch(err){
        res.status(500).json({message: 'Server Error'})
    }
}

// Listing Lotteries

exports.list = async (req, res) => {
    try{
        let all = await Lottery.find().populate('winner', 'name').populate('winner', 'name').sort({createdAt: -1});
        all = await Promise.all(all.map(all => finalise(all)));
        const current = all.filter(l => l.status === 'active');
        const past    = all.filter(l => l.status === 'past');
        res.json({ current, past });
    } catch(err){
        res.status(500).json({message: 'Server Error'});
        console.log(err);
    }
}

// Listing For Admin

exports.adminList = async(req, res) => {
    try{
        let lot = await Lottery.find().sort({createdAt: -1});
        lot = await Promise.all(lot.map(lot => finalise(lot)));
        res.json(lot);
    } catch(err){
        res.status(500).json({message: 'Server Error'});
        console.log(err);
    }
}

// Get Lotteries

exports.get = async (req, res) => {
    try{
        let lot = await Lottery.findById(req.params.id).populate('participants.user', 'name');
        if(!lot){
            return res.status(404).json({message: 'Lottery Not Found'});
        }
        lot = await finalise(lot);
        res.json(lot);
    } catch(err){
        res.status(500).json({message: 'Server Error'});
    }
}

// Getting Details For Admin Round

exports.adminRound = async(req, res) => {
    try {
        const lot = await Lottery.findById(req.params.id)
          .populate('participants.user');
        if (!lot) return res.status(404).json({ message: 'Not found.' });
        const distributed = lot.participants.reduce((s,p) => s + p.won, 0);
        res.json({ lottery: lot, distributed });
      } catch (err) {
        res.status(500).json({ message: 'Server error.' });
      }
}

// Active Round Details

exports.active = async(req, res) => {
    try{
        const lot = await Lottery.findById(req.params.id);
        if(!lot){
            return res.status(404).json({message: 'Lottery Not Found, Please Check The Link'});
        }
        console.log(lot);
        res.json(lot);
    } catch(err){
        res.status(500).json({message: 'Server Error'});
    }
}

// Past Round Details

exports.past = async(req, res) => {
        try {
          const lottery = await Lottery.findById(req.params.id)
            .populate('participants.user', 'name')
            .populate('winner', 'name');
          res.status(200).json(lottery);
        } catch (error) {
          res.status(500).json({ message: 'Error fetching lottery details' });
        }
}

// Participants List

exports.part = async(req, res) => {
    try {
        const lottery = await Lottery.findById(req.params.id)
          .populate('participants.user', 'name');
        res.status(200).json(lottery.participants);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching participants' });
      }
}

// Joining Lottery

exports.join = async(req, res) => {
    const {id, user, number} = req.body;
    try{
        let lot = await Lottery.findById(id);
        if(!lot){
            return res.status(404).json({message: 'Lottery Not Found'});
        }
        lot = await finalise(lot);
        if(lot.status === 'past'){
            return res.status(400).json({message: 'Lottery has ended'});
        }
        if(lot.participants.some(p => p.number === number)){
            return res.status(400).json({message: 'Number already taken'});
        }
        if(lot.participants.length === lot.max){
            return res.status(400).json({message: 'Too Late, Lottery is full'});
        }
        
        const userx = await User.findById(user);
        
        if((userx.cash + userx.bonus) < lot.fees){
            return res.status(400).json({success: false, message: "Insufficient balance"});
        }

        let bonusDeduction = 0;
        let walletDeduction = 0;

        if(userx.bonus >= lot.fees){
            bonusDeduction = lot.fees;
            walletDeduction = 0;
        } else {
            bonusDeduction = user.bonus;
            walletDeduction = lot.fees - bonusDeduction;
        }

        // Update user's balance and bonus
        userx.bonus -= bonusDeduction;
        userx.cash -= walletDeduction;

        lot.participants.push({user: user, number: number});

        await lot.save();
        await userx.save();
        res.json(lot);
    } catch(err){
        console.log(err);
        res.status(500).json({message: 'Server Error'});
    }
};

// Allocate Payouts And Finalize
exports.savePayouts = async(req, res) => {
    const {payouts} = req.body;
    try{
        const lot = await Lottery.findById(req.params.id);
        if(!lot){
            return res.status(404).json({message: 'Not Found'});
        }
        if(lot.status === 'past'){
            return res.status(400).json({message: 'Already finalized'});
        }

        // Update each participant's won amount, do not credit user cash here
        for(let {pid, won} of payouts){
            const part = lot.participants.id(pid);
            if(!part){
                continue;
            }
            part.won = won;
            // Do not credit user cash here; it will be done when the round ends
        }

        // Determine Top Winner
        lot.participants.sort((a, b) => b.won - a.won);
        if(lot.participants.length){
            lot.winner = lot.participants[0].user;
            lot.winnerNumber = lot.participants[0].number;
        }
        await lot.save();

        const distributed = lot.participants.reduce((s,p) => s+p.won, 0);
        res.json({message: 'Payouts Saved', lottery: lot, distributed});
    } catch{
        res.status(500).json({message: 'Server Error'});
    }
}

exports.user = async(req, res) => {
    const {id} = req.params;
    try{
        const user = await User.findById(id);
        res.json({name: user.name, mail: user.email, cash:user.cash, bonus: user.bonus});
    } catch(err){
        console.log(err);
        res.status(404).json({message: "User Not Found, Try Logging In Again"});
    }
}