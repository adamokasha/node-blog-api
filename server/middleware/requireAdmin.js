const jwt = require('jsonwebtoken');
const {User} = require('./../models/user');

const requireAdmin = async (req, res, next) => {
  const token = req.header('x-auth');
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      throw new Error();
    }
  } catch (e) {
    return res.status(401).send({error: 'You are not authorized to perform this request.'});
  }
  const user = await User.findByToken(token);
  req.user = user;

  next();
};

module.exports = {requireAdmin};