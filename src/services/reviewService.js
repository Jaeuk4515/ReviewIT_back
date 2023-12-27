const reviewModel = require("../db/models/reviewModel");
const deleteImageFromS3 = require('../services/deleteImageFromS3');
const userModel = require('../db/models/userModel');

class ReviewService {
  async findReviewById(reviewId) {
    const reviewInfo = await reviewModel.findById(reviewId);
    return reviewInfo;
  };

  async uploadReview(reviewInfo) {
    const uploadedReview = await reviewModel.create(reviewInfo);
    return uploadedReview;
  };

  async getReviews(page, perPage, sortOption, category = null) {
    const { reviews, totalPage } = await reviewModel.findAllReviews(page, perPage, sortOption, category);
    return { reviews, totalPage };
  };

  async getRecommendReviews(page, perPage, sortOption, status) {
    const { reviews, totalPage } = await reviewModel.findRecommendReviews(page, perPage, sortOption, status);
    return { reviews, totalPage };
  }

  async updateReview(reviewId, updateInfo) {
    const updatedReview = await reviewModel.updateReviewById(reviewId, updateInfo);
    return updatedReview;
  };

  async deleteReview(reviewId) {
    const { productImages } = await reviewModel.findById(reviewId);
    console.log(productImages);
    productImages.map(key => {
      if (key) deleteImageFromS3(key.slice(8).split("/")[1]);
    });
    await reviewModel.deleteReviewById(reviewId);
  };

  async toggleLikey(userId, reviewId) {
    const user = await userModel.findUserById(userId);
  
    // 유저가 좋아요를 누른 리뷰인지 확인
    const isLiked = user.likey.includes(reviewId);
  
    if (isLiked) {
      // 좋아요를 누른 리뷰면 리뷰의 likey를 1 감소시킨 후 유저의 likey 배열에서 userId를 제거 
      const updatedReview = await reviewModel.decreaseLikey(reviewId);
      user.likey.pull(reviewId);
      await user.save();
      return updatedReview.likey;
    } else {
      // 좋아요를 누르지 않은 리뷰면 리뷰의 likey를 1 증가시킨 후 유저의 likey 배열에 userId를 추가 
      const updatedReview = await reviewModel.increaseLikey(reviewId);
      user.likey.push(reviewId);
      await user.save();
      return updatedReview.likey;
    };
  };

  async getMyReviews(userId) {
    const reviews = await reviewModel.findByUserId(userId);
    // return reviews;
    const thumbnailInfo = reviews.map(({ _id, productImages, reviewTitle, productName, grade, createdAt }) => {
      const date = new Date(createdAt);
      return {
        reviewId: _id,
        productImage: productImages[0],
        reviewTitle,
        productName,
        grade,
        createdAt: date.toLocaleDateString('ko-KR')
      };
    });
    return thumbnailInfo;
  };

  async getTopReviews() {
    const reviews = await reviewModel.findTopReviews();
    return reviews;
  };

  async getSearchProduct(page, perPage, sortOption, searchText, category) {
    const { reviews, totalPage } = await reviewModel.findByProductName(page, perPage, sortOption, searchText, category);
    return { reviews, totalPage };
  };

  async findReviewsProductImages(userId) {
    const reviews = await reviewModel.findByUserId(userId);
    const imageKeyArray = reviews.map(({ productImages }) => {
      let imagesKeys = [];
      for (let i = 0; i < productImages.length; i++) {
        imagesKeys.push(productImages[i].slice(8).split("/")[1]);
      };
      return imagesKeys;
    });
    return imageKeyArray;
  };
};

const reviewService = new ReviewService(reviewModel);

module.exports = reviewService;