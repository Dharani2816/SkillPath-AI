class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Wraps async route handlers so thrown errors reach the error middleware.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const enumValue = (value, allowed, field) => {
  if (value === undefined || value === null) return undefined;
  const v = String(value).toUpperCase();
  if (!allowed.includes(v)) throw new HttpError(400, `Invalid ${field}. Allowed: ${allowed.join(', ')}`);
  return v;
};

module.exports = { HttpError, asyncHandler, enumValue };
