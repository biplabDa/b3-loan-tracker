const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../middleware/asyncHandler');
const dashboardService = require('../services/dashboardService');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardSummary();
  console.log("Dashboard data:", data);
  res.status(StatusCodes.OK).json(data);
});

module.exports = {
  getDashboard
};
