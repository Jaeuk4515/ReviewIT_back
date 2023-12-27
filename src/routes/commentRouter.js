const { Router } = require('express');
const commentService = require('../services/commentService');

const commentRouter = Router();

commentRouter.get('/:reviewId', async (req, res, next) => {
  try {
    const comments = await commentService.findComments(req.params.reviewId);
    console.log(comments);
    res.json(comments);
  } catch (error) {
    next(error);
  };
});

commentRouter.post('/create', async (req, res, next) => {
  try {
    const commentInfo = req.body;
    const createdComment = await commentService.createComment(commentInfo);
    console.log(createdComment);
    const { _id, userId, text, createdAt } = createdComment;
    const date = new Date(createdAt);
    res.json({ _id, userId, text, createdAt: `${date.toLocaleDateString('ko-KR')} ${date.toLocaleTimeString('ko-KR')}` });
  } catch (error) {
    next(error);
  };
});

commentRouter.delete('/delete/:commentId', async (req, res, next) => {
  try {
    const commentId = req.params.commentId;
    await commentService.deleteComment(commentId);
    res.status(200).json({ message: 'success' });
  } catch (error) {
    next(error);
  };
});

module.exports = commentRouter;