const { StatusCodes } = require('http-status-codes');

function notFound(req, res) {
  res.status(StatusCodes.NOT_FOUND).json({
    message: 'Route not found'
  });
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || StatusCodes.BAD_REQUEST;
  const message = err.message || 'Unexpected error';

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({ message });
}

module.exports = {
  notFound,
  errorHandler
};
