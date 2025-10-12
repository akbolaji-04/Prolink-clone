// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. Get the token from the request header
  const token = req.header('Authorization');

  // 2. Check if there's no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // The token from the header will look like "Bearer <token>", so we split it and get the actual token
  const actualToken = token.split(' ')[1];

  // 3. Verify the token
  try {
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

    // Add the user's ID from the token to the request object
    req.user = decoded.user; 
    next(); // Token is valid, proceed to the next step (the actual route)
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};