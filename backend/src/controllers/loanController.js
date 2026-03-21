const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../middleware/asyncHandler');
const loanService = require('../services/loanService');

const createLoan = asyncHandler(async (req, res) => {
  const data = await loanService.createLoan(req.body);
  res.status(StatusCodes.CREATED).json(data);
});

const getLoans = asyncHandler(async (req, res) => {
  const data = await loanService.getLoans(req.query.search || '');
  res.status(StatusCodes.OK).json(data);
});

const getOverdueLoans = asyncHandler(async (req, res) => {
  const data = await loanService.getOverdueLoans();
  res.status(StatusCodes.OK).json(data);
});

module.exports = {
  createLoan,
  getLoans,
  getOverdueLoans
};
