// 云函数：updateUserAvatar.js
const cloud = require('wx-server-sdk');
const fs = require('fs');
const path = require('path');
const util = require('util');
const cloudStorage = cloud.storage();

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 表示在当前云环境中操作
});

exports.main = async (event, context) => {
  const { openid, avatarFilePath } = event; // 从事件对象中获取用户的openid和头像文件路径

  if (!openid || !avatarFilePath) {
    return {
      success: false,
      message: '缺少必要的参数',
      data: null
    };
  }

  try {
    // 读取上传的头像文件
    const readStream = util.promisify(fs.readFile)(avatarFilePath);
    const buffer = await readStream;

    // 上传头像到云存储
    const uploadResult = await cloudStorage.putFile({
      data: buffer,
      filePath: `user_avatars/${openid}.png`, // 设置文件路径和名称      cloudPath: `user_avatars/${openid}.png` // 指定存储到云存储的路径
    });

    if (uploadResult.statusCode === 200) {
      // 上传成功，更新云数据库中的头像URL
      const updateResult = await cloud.database().collection('users').doc(openid).update({
        data: {
          avatarUrl: uploadResult.data.fileID // 使用文件ID更新用户头像URL
        }
      });

      if (updateResult.stats.updated) {
        // 更新成功
        return {
          success: true,
          message: '头像更新成功',
          data: { avatarUrl: uploadResult.data.fileID } // 返回新的头像URL
        };
      } else {
        // 更新失败
        return {
          success: false,
          message: '更新用户信息失败',
          data: null
        };
      }
    } else {
      // 上传失败
      return {
        success: false,
        message: '头像上传失败',
        data: null
      };
    }
  } catch (error) {
    console.error('更新头像失败:', error);
    return {
      success: false,
      message: '更新头像失败',
      data: null
    };
  }
};