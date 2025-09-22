const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_jwt_secret'; // ⚠️ Use process.env.JWT_SECRET in production

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  // Token is usually sent in the Authorization header as "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach decoded payload (user_id, mobile_number) to request
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(403).json({ success: false, error: 'Invalid or expired token.' });
  }
}

module.exports = authenticateToken;
