const { model } = require('mongoose');
const ReviewSchema = require('../schemas/reviewSchema');

const Review = model("Review", ReviewSchema);

class ReviewModel {
  async findById(reviewId) {
    const reviewInfo = await Review.findOne({ _id: reviewId });
    if (!reviewInfo) {
      throw new Error(`${reviewId}에 해당하는 글이 존재하지 않습니다.`);
    };
    return reviewInfo;
  };
  
  async create(reviewInfo) {
    const createdReview = await Review.create(reviewInfo);
    return createdReview;
  };

  async findAll() {
    const reviews = await Review.find({});
    return reviews;
  };
  
  async findAllReviews(page, perPage, sortOption, category) {
    const sortQuery = {};
    if (sortOption === "createdAt") {
      sortQuery.createdAt = -1;
    };

    const query = category ? { category } : {};

    const reviewsPromise = Review.find(query)
      .sort(sortQuery)
      .skip(perPage * (page - 1))
      .limit(perPage);

    const countPromise = Review.countDocuments(query);

    const [ reviews, count ] = await Promise.all([
      reviewsPromise,
      countPromise
    ]);

    const totalPage = Math.ceil(count / perPage);

    return { reviews, totalPage };
  };

  async findRecommendReviews(page, perPage, sortOption, status) {
    const sortQuery = {};
    if (sortOption === "createdAt") {
      sortQuery.createdAt = -1;
    };

    let gradeNumber = 0;
    if (status === "good-product") gradeNumber = 5;
    if (status === "bad-product") gradeNumber = 1;

    const reviewsPromise = Review.find({ grade: gradeNumber })
      .sort(sortQuery)
      .skip(perPage * (page - 1))
      .limit(perPage);

    const countPromise = Review.countDocuments({ grade: gradeNumber });

    const [ reviews, count ] = await Promise.all([
      reviewsPromise,
      countPromise
    ]);

    const totalPage = Math.ceil(count / perPage);

    return { reviews, totalPage };
  };

  async updateReviewById(reviewId, updateInfo) {
    const updatedReview = await Review.findByIdAndUpdate(reviewId, updateInfo, { new: true });
    return updatedReview;
  };

  async deleteReviewById(reviewId) {
    await Review.findByIdAndDelete(reviewId);
  };

  async increaseLikey(reviewId) {
    const updatedReview = await Review.findByIdAndUpdate(reviewId, { $inc: { likey: 1 } }, { new: true });
    return updatedReview;
  };

  async decreaseLikey(reviewId) {
    const updatedReview = await Review.findByIdAndUpdate(reviewId, { $inc: { likey: -1 } }, { new: true });
    return updatedReview;
  };

  async findByUserId(id) {
    const updatedReview = await Review.find({ userId: id });
    return updatedReview;
  };

  async findTopReviews() {
    const topReviews = await Review.find({}).sort({ likey: -1 }).limit(20);
    return topReviews;
  };

  async findByProductName(page, perPage, sortOption, searchText, targetCategory) {
    const sanitizedSearchText = searchText.trim();

    const sortQuery = {};
    if (sortOption === "createdAt") {
      sortQuery.createdAt = -1;
    };

    let reviewsPromise;
    let countPromise;

    if (!targetCategory) {
      reviewsPromise = Review.find({ productName: { $regex: new RegExp(sanitizedSearchText, 'i') } })
        .sort(sortQuery)
        .skip(perPage * (page - 1))
        .limit(perPage);

      countPromise = Review.countDocuments({ productName: { $regex: new RegExp(sanitizedSearchText, 'i') } });
    } else {
      if (targetCategory === "good-product" || targetCategory === "bad-product") {
        reviewsPromise = Review.find({ 
          grade: targetCategory === "good-product" ? 5 : 1,
          productName: { $regex: new RegExp(sanitizedSearchText, 'i') } 
        })
          .sort(sortQuery)
          .skip(perPage * (page - 1))
          .limit(perPage);
  
        countPromise = Review.countDocuments({ 
          grade: targetCategory === "good-product" ? 5 : 1,
          productName: { $regex: new RegExp(sanitizedSearchText, 'i') } 
        });
      } else {
        reviewsPromise = Review.find({ 
          category: targetCategory,
          productName: { $regex: new RegExp(sanitizedSearchText, 'i') } 
        })
          .sort(sortQuery)
          .skip(perPage * (page - 1))
          .limit(perPage);
  
        countPromise = Review.countDocuments({ 
          category: targetCategory,
          productName: { $regex: new RegExp(sanitizedSearchText, 'i') } 
        });
      };
    };

    const [ reviews, count ] = await Promise.all([
      reviewsPromise,
      countPromise
    ]);

    const totalPage = Math.ceil(count / perPage);

    return { reviews, totalPage };
  };

  async deleteReviewsByUserId(userId) {
    await Review.deleteMany({ userId });
  };
};

const reviewModel = new ReviewModel();

module.exports = reviewModel;