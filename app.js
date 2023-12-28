const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const userRouter = require('./src/routes/userRouter');
const reviewRouter = require('./src/routes/reviewRouter');
const commentRouter = require('./src/routes/commentRouter');

const app = express();

const config = {
  PORT: process.env.PORT,
  DB_URL: process.env.DB_URL
}

mongoose.connect(config.DB_URL, {
  dbName: 'ReviewMoa'
});

mongoose.connection.on('connected', () => console.log('정상적으로 MongoDB에 연결되었습니다.'));

const corsOptions = {
  // origin: 'http://localhost:3000',
  origin: 'https://review-it-tawny.vercel.app',
  optionsSucessStatus: 200,
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/user', userRouter);
app.use('/review', reviewRouter);
app.use('/comment', commentRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'internal error' });
});

app.listen(config.PORT, () => {
  console.log(`서버가 ${config.PORT}번 포트에서 실행중..`)
});