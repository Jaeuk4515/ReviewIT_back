const commentModel = require('../db/models/commentModel');

class CommentService {
  async findComments(reviewId) {
    const comments = await commentModel.findByReviewId(reviewId);
    const commentsInfo = comments.map(({ _id, userId, text, createdAt }) => {
      const date = new Date(createdAt);
      return {
        commentId: _id,
        userId,
        text,
        createdAt: `${date.toLocaleDateString('ko-KR')} ${date.toLocaleTimeString('ko-KR')}`
      };
    });
    return commentsInfo;
  };

  async findMyComments(userId) {
    const comments = await commentModel.findByUserId(userId);
    const commentInfo = comments.map(({ reviewId, text, createdAt }) => {
      const date = new Date(createdAt);
      return {
        reviewId,
        text,
        createdAt: `${date.toLocaleDateString('ko-KR')} ${date.toLocaleTimeString('ko-KR')}`
      };
    });
    return commentInfo;
  };

  async createComment(commentInfo) {
    const createdComment = await commentModel.create(commentInfo);
    return createdComment;
  };

  async deleteComment(commentId) {
    await commentModel.deleteCommentById(commentId);
  };
};

const commentService = new CommentService(commentModel);

module.exports = commentService;