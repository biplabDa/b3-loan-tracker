const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../middleware/asyncHandler');
const customerService = require('../services/customerService');

const createCustomer = asyncHandler(async (req, res) => {
  const data = await customerService.createCustomer(req.body);
  res.status(StatusCodes.CREATED).json(data);
});

const updateCustomer = asyncHandler(async (req, res) => {
  const data = await customerService.updateCustomer(req.params.id, req.body);
  res.status(StatusCodes.OK).json(data);
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const data = await customerService.deleteCustomer(req.params.id);
  res.status(StatusCodes.OK).json(data);
});

const getCustomers = asyncHandler(async (req, res) => {
  const data = await customerService.getCustomers(req.query.search || '');
  res.status(StatusCodes.OK).json(data);
});

module.exports = {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomers
};
