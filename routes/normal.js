const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/LotteryController');
const transaction = require('../controllers/Transaction');

router.get('/rounds', ctrl.list);
router.get('/active/:id', ctrl.active);
router.get('/past/:id', ctrl.past);
router.get('/:id/participants', ctrl.part);
router.post('/join', ctrl.join);
router.get('/:id', ctrl.user);
router.post('/deposit', transaction.createDepositRequest);
router.post('/withdraw', transaction.createWithdrawalRequest);
router.get('/deposit/:id', transaction.getUserDepositRequests);
router.get('/withdraw/:id', transaction.getUserWithdraw);
router.get('/history/:id', transaction.getUserHistory);

module.exports = router;