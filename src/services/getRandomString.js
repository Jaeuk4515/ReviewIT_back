const crypto = require('crypto');

function generateRandomString() {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomString = '';

  for (let i = 0; i < 10; i++) {
    const randomIndex = crypto.randomInt(charset.length);
    randomString += charset[randomIndex];
  }

  return randomString;
}

module.exports = generateRandomString;