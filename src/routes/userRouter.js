const { Router } = require('express');
const userService = require('../services/userService');
const userModel = require('../db/models/userModel');
const loginRequired = require('../middlewares/loginRequired');
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const deleteImageFromS3 = require('../services/deleteImageFromS3');
const getRandomString = require('../services/getRandomString');
const reviewService = require('../services/reviewService');
const reviewModel = require('../db/models/reviewModel');
const commentModel = require('../db/models/commentModel');

const userRouter = Router();

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

userRouter.post('/register', async (req, res, next) => {
  try {
    const result = await userService.addUser(req.body);
    if (result === '사용중인 이메일입니다.' | result === '사용중인 닉네임입니다.') {
      res.status(200).json({ message: result });
    } else {
      res.status(200).json({ message: 'success' });
    }
  } catch (error) {
    next(error);
  }
});

userRouter.post('/login', async (req, res, next) => {
  try {
    console.log(req.body);
    const result = await userService.getUserToken(req.body);
    if (result === '가입되지 않은 회원입니다.' || result === '비밀번호가 일치하지 않습니다.') {
      res.status(200).json({ message: result });
    } else {
      res.cookie('token', result);
      res.status(200).json({ message: 'success' });
    }
  } catch (error) {
    next(error);
  }
});

userRouter.get('/logout', (req, res, next) => {
  try {
    res.clearCookie('token');
    res.status(200).json({ message: 'success' });
  } catch (error) {
    next(error);
  }
});

// 현재 접속중인 계정의 유저 정보 조회
userRouter.get('/my', loginRequired, async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.currentUserId);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// 특정 _id의 유저 정보 조회
userRouter.post('/getUserInfo', async (req, res, next) => {
  try {
    const userInfo = await userService.findUserById(req.body._id);
    res.json(userInfo);
  } catch (error) {
    next(error);
  }
});

userRouter.get('/getUserId', loginRequired, async (req, res, next) => {
  try {
    res.json(req.currentUserId);
  } catch (error) {
    next(error);
  }
});

userRouter.patch('/update/:userId', upload.single('userImage'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    let newUserImage;

    if (req.file) {
      newUserImage = req.file.location;
    };

    const updateFields = { nickname: req.body.nickname };
    if (newUserImage !== undefined) {
      const currentUserImage = (await userService.findUserById(userId)).userImage;
      const imageKey = currentUserImage.slice(8).split("/")[1];
      if (imageKey !== "1702398964719-FseUbcONBF") {  // 유저의 현재 이미지는 s3에서 삭제 (현재 이미지가 기본 이미지일 경우는 삭제 X)
        deleteImageFromS3(imageKey);
      };
      updateFields.userImage = newUserImage;
    };

    // 유저 이미지를 기본 이미지로 변경하는 경우
    if (req.query.default === "yes") {
      const currentUserImage = (await userService.findUserById(userId)).userImage;
      const imageKey = currentUserImage.slice(8).split("/")[1];
      if (imageKey !== "1702398964719-FseUbcONBF") {  // 유저의 현재 이미지는 s3에서 삭제 (현재 이미지가 기본 이미지일 경우는 삭제 X)
        deleteImageFromS3(imageKey);
      };
      updateFields.userImage = "https://jaeukpost.s3.ap-northeast-2.amazonaws.com/1702398964719-FseUbcONBF";
    };

    const { nickname, userImage } = await userModel.updateUserById(userId, {
      $set: updateFields
    });
    
    res.json({ nickname, userImage });
  } catch (error) {
    next(error);
  };
});

userRouter.patch('/change-password', async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.status(200).json({ message: "확인 비밀번호가 일치하지 않습니다." });
    };
    const response = await userService.findUserByEmailAndChangePassword(email, newPassword);
    res.status(200).json({ message: response });
  } catch (error) {
    next(error);
  };
});

userRouter.delete('/delete/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;
    
    // 유저가 작성한 리뷰들의 제품 이미지들 찾기 (s3에 저장된 이미지명(key)에 해당하는 부분(1702398964719-FseUbcONBF과 같은 형식) 추출)
    const imageKeyArray = await reviewService.findReviewsProductImages(userId);

    // 유저가 작성한 리뷰의 제품 이미지들 s3에서 삭제 
    for (const keys of imageKeyArray) {
      for (const key of keys) {
        deleteImageFromS3(key);
      };
    };

    // 리뷰 삭제
    await reviewModel.deleteReviewsByUserId(userId);

    // 댓글 삭제
    await commentModel.deleteCommentsByUserId(userId);

    // 유저 삭제 
    const currentUserImage = (await userService.findUserById(userId)).userImage;
    const imageKey = currentUserImage.slice(8).split("/")[1];
    if (imageKey !== "1702398964719-FseUbcONBF") {  // 유저의 현재 이미지는 s3에서 삭제 (현재 이미지가 기본 이미지일 경우는 삭제 X)
      deleteImageFromS3(imageKey);
    };
    const result = await userService.deleteUser(userId);
    res.clearCookie('token');
    res.status(200).json({ message: result });
  } catch (error) {
    next(error);
  };
});

module.exports = userRouter;