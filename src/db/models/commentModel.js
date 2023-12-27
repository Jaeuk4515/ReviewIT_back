const { model } = require('mongoose');
const CommentSchema = require('../schemas/commentSchema');

const Comment = model("comment", CommentSchema);

class CommentModel {
  async findById(commentId) {
    const comment = await Comment.findOne({ _id: commentId });
    if (!review) {
      throw new Error(`${commentId}에 해당하는 댓글이 존재하지 않습니다.`);
    };
    return comment;
  };

  async findByReviewId(id) {
    const comments = await Comment.find({ reviewId: id });
    return comments;
  };

  async findByUserId(id) {
    const comments = await Comment.find({ userId: id });
    return comments;
  };
  
  async create(commentInfo) {
    const createdComment = await Comment.create(commentInfo);
    return createdComment;
  };

  async deleteCommentById(commentId) {
    await Comment.findByIdAndDelete(commentId);
  };

  async deleteCommentsByUserId(userId) {
    await Comment.deleteMany({ userId });
  };
};

const commentModel = new CommentModel();

module.exports = commentModel;