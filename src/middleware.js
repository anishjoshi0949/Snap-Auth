require("dotenv").config(); // Load the environment variables based on the .env files

const cors = require("cors");
const morgan = require("morgan");

// Use morgan to log requests in a better format
const logFormat = ":method :url :status :response-time ms - :res[content-length]";
const requestLogger = morgan(logFormat);

// CORS middleware for allowing cross-origin requests
const corsOptions = {
  origin: process.env.ALLOW_ORIGIN, // Replace with the actual domain for frontend
  methods: "GET,POST,PUT,PATCH,DELETE",
};

const applyCors = cors(corsOptions);

module.exports = { applyCors, requestLogger };