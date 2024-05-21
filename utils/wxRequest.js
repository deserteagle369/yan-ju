// utils/wxRequest.js

export default function wxRequest(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: options.url,
      data: options.data || {},
      method: options.method || 'GET',
      header: Object.assign({}, {
        'content-type': 'application/json' // 默认请求头
        // ... 其他默认请求头设置
      }, options.header),
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(`请求错误，状态码：${res.statusCode}`));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}