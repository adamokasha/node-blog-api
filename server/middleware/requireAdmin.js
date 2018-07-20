const jwt = require('jsonwebtoken');

const requireAdmin = (req, res, next) => {
  const token = req.header('x-auth');
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      throw new Error();
    }
  } catch (e) {
    return res.status(401).send();
  }

  next();
};

module.exports = {requireAdmin};