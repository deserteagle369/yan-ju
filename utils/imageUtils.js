// utils/imageUtils.js
import WeCropper from '../components/we-cropper/we-cropper';
export function compressImage(imagePath, quality) {
  return new Promise((resolve, reject) => {
    wx.createCanvasContext('compressCanvas').then(ctx => {
      wx.getImageInfo({ src: imagePath }).then(img => {
        ctx.drawImage(imagePath, 0, 0, img.width, img.height);

        ctx.draw(false, async () => {
          try {
            const compressedPath = await wx.canvasToTempFilePath({
              canvasId: 'compressCanvas',
              quality,
            });

            resolve(compressedPath);
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  });
}
export async function cropImage(cropperInstance, imagePath) {
  return new Promise(async (resolve, reject) => {
    try {
      // 使用传入的cropper实例
      await cropperInstance.pushOrign(imagePath); // 设置图片源
      this.cropper.on('imageLoad', () => {
        // 图片加载成功后，可以进行裁剪操作
        this.cropper.getCropperImage((tempFilePath) => {
          // 处理裁剪后的图片
        });
      });
      // 模拟用户完成裁剪操作，实际应用中可能需要UI交互
      const result = await cropperInstance.getCropperImage(); // 获取裁剪后的图片数据URL

      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

export async function uploadImageToCloud(imagePath) {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath: `images/${Date.now()}_${wx.getStorageSync('user').id}.jpg`, // 自定义云存储路径
      filePath: imagePath, // 图片本地路径
      success: res => {
        resolve(res.fileID);
      },
      fail: err => {
        reject(err);
      },
    });
  });
}
export async function getSignedImageUrl(fileID) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'cloudGetSignedUrl',
      data: {
        fileID,
      },
    });
    if (result && result.result) {
      return result.result;
    } else {
      throw new Error('Failed to get signed URL');
    }
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
}
async function compressAndCropImage(file) {
  // 获取图片信息
  const { width, height } = await wx.getImageInfo({ src: file.path });

  // 检查图片尺寸
  if (width < 100 || height < 100) {
    throw new Error('图片太小，请重新选择');
  }

  // 计算缩放比例
  const targetSize = 1000; // 目标最大边长
  const scale = Math.max(width, height) / targetSize;

  // 缩小图片
  const compressedFile = await wx.compressImage({
    src: file.path,
    quality: 0.8, // 压缩质量
    maxWidth: width / scale,
    maxHeight: height / scale,
  });

  // 裁剪图片至1:1比例
  const croppedFile = await wx.canvasToTempFilePath({
    canvasId: 'imageCropCanvas',
    x: 0,
    y: 0,
    width: compressedFile.width,
    height: compressedFile.height,
    destWidth: compressedFile.width,
    destHeight: compressedFile.height,
    success: (res) => res.tempFilePath,
  });

  // 转换为JPG格式
  const convertedFile = await wx.getImageInfo({
    src: croppedFile,
    success: ({ path }) => ({
      path,
      type: 'image/jpeg', // 修改文件类型为jpg
    }),
  });

  return convertedFile;
}
