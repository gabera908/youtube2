const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { message: 'Too many requests, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: { message: 'Rate limit exceeded for this endpoint.' } },
});

module.exports = { apiLimiter, strictLimiter };
