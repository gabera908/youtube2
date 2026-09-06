describe('Error Handler Middleware', () => {
  const errorHandler = require('../middleware/errorHandler');

  function createMockReq() {
    return {};
  }
  function createMockRes() {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    return res;
  }
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles generic errors with 500 status', () => {
    const err = new Error('Something went wrong');
    const req = createMockReq();
    const res = createMockRes();
    errorHandler(err, req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('handles custom status codes', () => {
    const err = new Error('Not Found');
    err.statusCode = 404;
    const req = createMockReq();
    const res = createMockRes();
    errorHandler(err, req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('handles validation errors with 400 status', () => {
    const err = new Error('Validation failed');
    err.statusCode = 400;
    const req = createMockReq();
    const res = createMockRes();
    errorHandler(err, req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ message: 'Validation failed' }),
      })
    );
  });
});
