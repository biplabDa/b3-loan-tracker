const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../middleware/asyncHandler');
const authService = require('../services/authService');

const login = asyncHandler(async (req, res) => {
  console.log('Login attempt:', req.body);
  const { username, password } = req.body;
  const data = await authService.login(username, password);
  res.status(StatusCodes.OK).json(data);
});

module.exports = {
  login
};
