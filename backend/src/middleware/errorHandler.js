// Central error handler — must have 4 params for Express to treat it as error middleware
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || "Internal Server Error";

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message    = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    message    = Object.values(err.errors).map((e) => e.message).join(", ");
    statusCode = 422;
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === "CastError") {
    message    = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("[ERROR]", err);
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
