const userModel = require('../db/models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

class UserService {
  async findUserById(userId) {
    const user = await userModel.findUserById(userId);
    return user;
  };

  // 회원가입
  async addUser(userInfo) {
    const userByEmail = await userModel.findByEmail(userInfo.email);
    const userByNickname = await userModel.findUserByNickname(userInfo.nickname);
    if (userByEmail) return '사용중인 이메일입니다.';
    if (userByNickname) return '사용중인 닉네임입니다.';

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(userInfo.password, 10);
    const newUserInfo = { ...userInfo, password: hashedPassword };

    // 회원 정보 db 저장
    const createdUser = await userModel.create(newUserInfo);

    return createdUser;
  };

  async getUserToken(loginInfo) {
    const { email, password } = loginInfo;

    // 해당 유저가 db에 존재하는지 확인
    const user = await userModel.findByEmail(email);
    if (!user) return '가입되지 않은 회원입니다.'

    // 비밀번호 일치하는지 확인
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return '비밀번호가 일치하지 않습니다.'

    // 로그인 성공 -> jwt 토큰 생성
    try {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY);
      return token;
    } catch (error) {
      console.error('토큰 생성 오류:', error);
      return '토큰 생성에 실패했습니다.'
    };
  };

  async findUserThumbnail(userId) {
    const user = await userModel.findUserByIdPopulate(userId);
    const thumbnailInfo = user.likey.map(({ _id, productImages, reviewTitle, productName, grade, createdAt }) => {
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

  async findUserByEmailAndChangePassword(email, newPassword) {
    const user = await userModel.findByEmail(email);
    if (!user) return "해당 이메일을 가진 유저가 존재하지 않습니다.";
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return "success";
  };

  async deleteUser(userId) {
    const result = await userModel.deleteUserById(userId);
    return result;
  };
};

const userService = new UserService(userModel);

module.exports = userService;
