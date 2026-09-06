describe('Rate Limiter', () => {
  const { apiLimiter, strictLimiter } = require('../middleware/rateLimiter');

  test('apiLimiter is defined', () => {
    expect(apiLimiter).toBeDefined();
    expect(typeof apiLimiter).toBe('function');
  });

  test('strictLimiter is defined', () => {
    expect(strictLimiter).toBeDefined();
    expect(typeof strictLimiter).toBe('function');
  });
});
