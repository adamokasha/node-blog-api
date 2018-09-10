const mongoose = require('mongoose');

const PostSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 60,
    trim: true
  },
  author: {
    type: String
  },
  createdAt: {
    type: Number,
    default: Date.now
  },
  category: {
    type: String,
    minlength: 4,
    maxlength: 16,
    default: 'General'
  },
  body: {
    type: String,
    required: true,
    minlength: 24,
    maxlength: 13468,
    trim: true
  },
  mainImage: {
    type: String,
  },
  thumbnail: {
    type: String
  },
  comments: [{
    comment: {
      type: String,
      minlength: 8,
      maxlength: 128
    },
    date: {
      type: Number,
      default: Date.now
    }, 
    createdBy: String
  }]
});

const Post = mongoose.model('Post', PostSchema);

module.exports = {Post};