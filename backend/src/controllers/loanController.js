const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../middleware/asyncHandler');
const loanService = require('../services/loanService');

const createLoan = asyncHandler(async (req, res) => {
  const data = await loanService.createLoan(req.body);
  res.status(StatusCodes.CREATED).json(data);
});

const updateLoan = asyncHandler(async (req, res) => {
  const data = await loanService.updateLoan(req.params.loanId, req.body || {});
  res.status(StatusCodes.OK).json(data);
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
  updateLoan,
  getLoans,
  getOverdueLoans
};
