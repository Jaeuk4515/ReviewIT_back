const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region : process.env.REGION,
  credentials : {
    accessKeyId : process.env.ACCESS_KEY,
    secretAccessKey : process.env.SECRET_KEY
  }
});

async function deleteImageFromS3(key) {
  try {
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    };

    const deleteCommand = new DeleteObjectCommand(params);
    await s3.send(deleteCommand);

    console.log(`Successfully deleted image: ${key}`);
  } catch (error) {
    console.error(`Error deleting image: ${key}`, error);
  };
};

module.exports = deleteImageFromS3;