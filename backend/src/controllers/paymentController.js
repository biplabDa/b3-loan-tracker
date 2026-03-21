const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../middleware/asyncHandler');
const paymentService = require('../services/paymentService');

const addPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.addPayment(req.body);
  res.status(StatusCodes.CREATED).json(data);
});

const getPaymentsByLoan = asyncHandler(async (req, res) => {
  const data = await paymentService.getPaymentsByLoan(req.params.loanId);
  res.status(StatusCodes.OK).json(data);
});

module.exports = {
  addPayment,
  getPaymentsByLoan
};
