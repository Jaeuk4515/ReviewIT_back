const { model, Types } = require('mongoose');
const UserSchema = require('../schemas/userSchema');

const User = model('User', UserSchema);

class UserModel {
  async findByEmail(email) {
    const user = await User.findOne({ email });
    return user;
  };

  async findUserById(userId) {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error(`${userId}에 해당하는 유저가 존재하지 않습니다.`);
    }
    return user;
  };

  async findUserByIdPopulate(userId) {
    const user = await User.findOne({ _id: userId }).populate('likey', '_id productImages reviewTitle productName grade createdAt');
    if (!user) {
      throw new Error(`${userId}에 해당하는 유저가 존재하지 않습니다.`);
    };
    return user;
  };

  async findUserByNickname(nickname) {
    const user = await User.findOne({ nickname });
    return user;
  };

  async create(userInfo) {
    const createdUser = await User.create(userInfo);
    return createdUser;
  };

  async updateUserById(userId, updateInfo) {
    const updatedUser = await User.findByIdAndUpdate(userId, updateInfo, { new: true });
    return updatedUser;
  };

  async deleteUserById(userId) {
    await User.findByIdAndDelete(userId);
    return "success";
  };
};

const userModel = new UserModel();

module.exports = userModel;