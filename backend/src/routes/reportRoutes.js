const express = require('express');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.get('/monthly-collections', reportController.getMonthlyCollections);
router.get('/customer/:customerId', reportController.getCustomerLoanReport);

module.exports = router;
