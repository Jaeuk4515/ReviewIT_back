const { Schema } = require('mongoose');

const UserSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  userImage: {
    type: String,
    default: "https://jaeukpost.s3.ap-northeast-2.amazonaws.com/1702398964719-FseUbcONBF"
  },
  likey: [{
    type: Schema.Types.ObjectId,
    ref: 'Review'
  }]
}, {
  timestamps: true,
  collection: 'User'
});

module.exports = UserSchema;