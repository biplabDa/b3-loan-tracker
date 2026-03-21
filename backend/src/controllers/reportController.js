const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../middleware/asyncHandler');
const reportService = require('../services/reportService');

const getMonthlyCollections = asyncHandler(async (req, res) => {
  const data = await reportService.monthlyCollectionReport();
  res.status(StatusCodes.OK).json(data);
});

const getCustomerLoanReport = asyncHandler(async (req, res) => {
  const data = await reportService.customerLoanReport(req.params.customerId);
  res.status(StatusCodes.OK).json(data);
});

module.exports = {
  getMonthlyCollections,
  getCustomerLoanReport
};
