const jwt = require('jsonwebtoken');

function loginRequired(req, res, next) {
  const userToken = req.headers.authorization.split(" ")[1];

  if (!userToken) {
    res.status(403).json({
      result: "forbidden-approach",
      message: "로그인한 유저만 사용할 수 있는 서비스입니다."
    });
    return;
  };

  try {
    const { id } = jwt.verify(userToken, process.env.JWT_SECRET_KEY);
    req.currentUserId = id;
    next();
  } catch (error) {
    res.status(403).json({
      result: "forbidden-approach",
      message: "정상적인 토큰이 아닙니다."
    });
  };

  return;
};

module.exports = loginRequired;