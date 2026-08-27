const { authenticateToken, generateTokens, optionalAuth } = require('./auth');
const { errorHandler, notFoundHandler, ApiError } = require('./errorHandler');

module.exports = {
  authenticateToken,
  generateTokens,
  optionalAuth,
  errorHandler,
  notFoundHandler,
  ApiError
};
