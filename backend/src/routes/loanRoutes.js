const express = require('express');
const loanController = require('../controllers/loanController');

const router = express.Router();

router.post('/', loanController.createLoan);
router.get('/', loanController.getLoans);
router.get('/overdue', loanController.getOverdueLoans);
router.put('/:loanId', loanController.updateLoan);

module.exports = router;
