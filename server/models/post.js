const mongoose = require('mongoose');

const PostSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 60,
    trim: true
  },
  author: {
    type: String,
    default: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  category: {
    type: String,
    default: 'General'
  },
  body: {
    type: String,
    required: true,
    minlength: 10,
    trim: true
  },
  comments: [{comment: String, date: Date, createdBy: String}]
});

const Post = mongoose.model('Post', PostSchema);

module.exports = {Post};