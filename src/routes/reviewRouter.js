const { Router } = require('express');
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const reviewService = require('../services/reviewService');
const deleteImageFromS3 = require('../services/deleteImageFromS3');
const getRandomString = require('../services/getRandomString');
const userService = require('../services/userService');
const commentService = require('../services/commentService');

const reviewRouter = Router();

const s3 = new S3Client({
  region : process.env.REGION,
  credentials : {
    accessKeyId : process.env.ACCESS_KEY,
    secretAccessKey : process.env.SECRET_KEY
  }
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET_NAME,
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + getRandomString()) //업로드시 파일명 변경가능
    }
  })
});

reviewRouter.post('/create', upload.array('productImages', 4), async (req, res, next) => {
  try {
    const reviewInfo = req.body;
    reviewInfo.grade = Number(reviewInfo.grade);

    reviewInfo.productImages = [];
    req.files.map(img => {
      reviewInfo.productImages.push(img.location);
    });
    // reviewInfo.productImages = ['a', 'b', 'c', 'd'];

    const createdInfo = await reviewService.uploadReview(reviewInfo);
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.status(200).json({ message: 'success', reviewId: createdInfo._id });
  } catch (error) {
    next(error);
  };
});

// 아래의 /:reviewId 라우터보다 위에있어야 함. 순서 중요!!!
reviewRouter.get("/topReviews", async (req, res, next) => {
  try {
    const reviews = await reviewService.getTopReviews();
    const thumbnailInfo = reviews.map(({ _id, productName, productImages, grade }) => ({
      reviewId: _id,
      productName,
      productImage: productImages[0],
      grade
    }));
    res.json(thumbnailInfo);
  } catch (error) {
    next(error);
  };
});

reviewRouter.get('/:reviewId', async (req, res, next) => {
  try {
    const reviewInfo = await reviewService.findReviewById(req.params.reviewId);
    res.status(200).json(reviewInfo);
  } catch (error) {
    next(error);
  };
});

reviewRouter.get('/', async (req, res, next) => {
  try {
    let page = Number(req.query.page || 1);
    let perPage = Number(req.query.perPage || 12);
    const sortOption = req.query.sortOption || "createdAt";

    const { reviews, totalPage } = await reviewService.getReviews(page, perPage, sortOption);
    const thumbnailInfo = reviews.map(({ _id, productName, productImages, grade }) => ({
      reviewId: _id,
      productName,
      productImage: productImages[0],
      grade
    }));
    res.json({ thumbnailInfo, totalPage });
  } catch (error) {
    next(error);
  };
});

reviewRouter.get('/category/:category', async (req, res, next) => {
  try {
    let page = Number(req.query.page || 1);
    let perPage = Number(req.query.perPage || 12);
    const sortOption = req.query.sortOption || "createdAt";

    const { reviews, totalPage } = await reviewService.getReviews(page, perPage, sortOption, req.params.category);

    const thumbnailInfo = reviews.map(({ _id, productName, productImages, grade }) => ({
      reviewId: _id,
      productName,
      productImage: productImages[0],
      grade
    }));
    res.json({ thumbnailInfo, totalPage });
  } catch (error) {
    next(error);
  };
});

reviewRouter.patch('/update/:reviewId', upload.array("newProductImages", 4), async (req, res, next) => {
  try {
    let { reviewTitle, category, productName, productLink, reviewContent, grade, productImages, deletedProductImages } = req.body;
    console.log(productImages);
    const reviewId = req.params.reviewId;

    // productImages가 배열임을 보장하기 위함 
    if (!productImages) {  // 클라이언트쪽에서 productImages가 빈 배열인 상태로 전송 시 여기서는 productImages가 undefined로 됨. 그래서 그상태로 아래의 if문이 실행되면 productImages의 첫 요소가 null이 되므로 여기서 필터링
      productImages = [];
    };
    if (!Array.isArray(productImages)) {  // 요소가 두개 이상이면 배열로 전송되지만 요소가 하나면 배열이 아니라 단일 객체로 전송되어서 push나 map 등 메서드 사용 시 에러남
      productImages = [ productImages ];
    };
    req.files.map(img => {
      productImages.push(img.location);
    });

    const updateData = {
      reviewTitle,
      category,
      productName,
      productLink,
      reviewContent,
      grade,
      productImages,
    };

    const updatedReview = await reviewService.updateReview(reviewId, updateData);
    console.log(updatedReview);

    // deletedProductImages가 배열임을 보장하기 위함
    if (!Array.isArray(deletedProductImages)) {
      deletedProductImages = [ deletedProductImages ];
    }
    deletedProductImages.map(key => {
      // deletedProductImages의 요소가 undefined 인 경우는 제외 -> 리뷰 수정 시 삭제한 이미지가 없으면 deletedProductImages는 [ undefined ] 가 되기 때문
      if (key) deleteImageFromS3(key.slice(8).split("/")[1]);
    });
    
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.status(200).json({ message: 'success' });
  } catch (error) {
    next(error);
  };
});

reviewRouter.delete('/delete/:reviewId', async (req, res, next) => {
  try {
    const reviewId = req.params.reviewId;
    await reviewService.deleteReview(reviewId);
    res.status(200).json({ message: 'success' });
  } catch (error) {
    next(error);
  };
});

reviewRouter.post('/likey/:reviewId/:userId', async (req, res, next) => {
  try {
    const response = await reviewService.toggleLikey(req.params.userId, req.params.reviewId);
    res.json(response);
  } catch (error) {
    next(error);
  };
});

reviewRouter.get('/recommendation/:status', async (req, res, next) => {
  try {
    let page = Number(req.query.page || 1);
    let perPage = Number(req.query.perPage || 12);
    const sortOption = req.query.sortOption || "createdAt";

    const { reviews, totalPage } = await reviewService.getRecommendReviews(page, perPage, sortOption, req.params.status);

    const thumbnailInfo = reviews.map(({ _id, productName, productImages, grade }) => ({
      reviewId: _id,
      productName,
      productImage: productImages[0],
      grade
    }));
    res.json({ thumbnailInfo, totalPage });
  } catch (error) {
    next(error);
  };
});

reviewRouter.get('/myReviews/:userId', async (req, res, next) => {
  const userId = req.params.userId;
  let thumbnailInfo = [];
  try {
    if (req.query.category === "write_review") {
      thumbnailInfo = await reviewService.getMyReviews(userId);
    };
    if (req.query.category === "like_review") {
      thumbnailInfo = await userService.findUserThumbnail(userId);
    };
    if (req.query.category === "write_comment") {
      thumbnailInfo = await commentService.findMyComments(userId);
    };
    console.log(thumbnailInfo);
    res.json(thumbnailInfo);
  } catch (error) {
    next(error);
  };
});

reviewRouter.get('/search/:productName', async (req, res, next) => {
  try {
    const searchText = req.params.productName;
    let page = Number(req.query.page || 1);
    let perPage = Number(req.query.perPage || 12);
    let category = req.query.category;
    const sortOption = req.query.sortOption || "createdAt";
    const { reviews, totalPage } = await reviewService.getSearchProduct(page, perPage, sortOption, searchText, category);
    const thumbnailInfo = reviews.map(({ _id, productName, productImages, grade }) => ({
      reviewId: _id,
      productName,
      productImage: productImages[0],
      grade
    }));
    res.json({ thumbnailInfo, totalPage });
    console.log(thumbnailInfo, totalPage);
  } catch (error) {
    next(error);
  };
});

module.exports = reviewRouter;