// cloudfunctions/getSignedUrl/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });  
const db = cloud.database();
const cos = cloud.cos();

exports.main = async (event, context) => {
  const fileID = event.fileID;
  try {
    const url = await cos.getTempFileURL({
      fileList: [fileID],
    });
    return url.fileList[0].tempFileURL;
  } catch (e) {
    console.error(e);
    return {
      error: e.message,
    };
  }
};