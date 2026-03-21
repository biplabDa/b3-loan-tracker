const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/', paymentController.addPayment);
router.get('/:loanId', paymentController.getPaymentsByLoan);

module.exports = router;
