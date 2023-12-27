const { Schema } = require('mongoose');

const ReviewSchema = new Schema({
  reviewTitle: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productLink: {
    type: String,
    required: true
  },
  reviewContent: {
    type: String,
    required: true
  },
  grade: {
    type: Number,
    required: true
  },
  productImages: {
    type: [String],
    required: true
    // 배열은 빈 배열이어도 배열 자체가 존재하는 것으로 간주되기 때문에, 제품 이미지 하나도 안보내도 required 에러 안남. 어차피 프론트에서 사진 안넣으면 전송 안되게 처리할거라 상관은 없을듯
  },
  userId: {
    type: String,
    required: true
  },
  likey: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'Review'
}
);

module.exports = ReviewSchema;