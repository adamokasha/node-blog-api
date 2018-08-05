// const jwt = require('jsonwebtoken');
const {User} = require('./../models/user');

// const requireAuth = (req, res, next) => {
//   const token = req.header('x-auth');
//   let decoded;

//   try {
//     decoded = jwt.verify(token, process.env.JWT_SECRET);
//   } catch (e) {
//     return res.send({message: 'Unauthorized', status: 401});
//   }

//   next();
// };

const requireAuthAsync = async (req, res, next) => {
  const token = req.header('x-auth');

  try {
    const user = await User.findByToken(token);
    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    return res.status(401).send(e);
  }
}

module.exports = {requireAuthAsync};