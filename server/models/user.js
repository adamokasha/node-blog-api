const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const uniqueValidator = require('mongoose-unique-validator');

const UserSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: (v) => validator.isEmail(v),
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  displayName: {
    type: String,
    required: true,
    unique: true,
    minlength: 6,
    maxlength: 12
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  token: {
    type: String,
  }
});

// Apply uniqueValidator
UserSchema.plugin(uniqueValidator, {message: 'The {PATH} {VALUE} is already in use. Please use another.'});

// Override toJSON method so only certain values are sent back
UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email', 'displayName', 'role']);
};

UserSchema.methods.generateAuthToken = function () {
  const user = this;
  const _id = user._id.toHexString();
  let token;

  if (user.role === 'admin') {
    token = jwt.sign({_id, role: 'admin'}, process.env.JWT_SECRET);
  } else {
    token = jwt.sign({_id, role: 'user'}, process.env.JWT_SECRET);
  }

  user.token = token;

  return user.save().then(() => {
    return token;
  });
};

UserSchema.statics.findByToken = function (token) {
  const User = this;
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return Promise.reject();
  }

  return User.findOne({
    _id: decoded._id,
    token: token
  });
}

UserSchema.statics.findByCredentials = function (email, password) {
  const User = this;

  return User.findOne({email}).then((user) => {
    if (!user) {
      return Promise.reject();
    }

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, function (err, res) {
        if (res) {
          resolve(user);
        } else {
          reject();
        }
      });  
    })
  });
}

UserSchema.methods.removeToken = function (token) {
  const user = this;
  
  return user.update({ $unset: {token} });
}

UserSchema.pre('save', function (next, done) {
  const user = this;

  // Check first to see if password was modified, if not, no need to hash password again
  if (user.isModified('password')) {
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(user.password, salt, function (err, hash) {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = {User};