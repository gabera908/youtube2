function errorHandler(err, req, res, _next) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error: ${err.message}`);
  console.error(`[${timestamp}] Stack: ${err.stack}`);
  console.error(`[${timestamp}] Request: ${req.method} ${req.originalUrl}`);

  const statusCode = err.statusCode || 500;

  let message;
  if (process.env.NODE_ENV === 'production') {
    message = statusCode === 500 ? 'Internal Server Error' : err.message;
  } else {
    message = err.message || 'Internal Server Error';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
