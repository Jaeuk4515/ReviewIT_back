const { Schema } = require('mongoose');

const CommentSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  reviewId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'Comment'
});

module.exports = CommentSchema;