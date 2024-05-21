// utils/promisifyRequest.js
function promisifyRequest(requestFn) {
  return function (options) {
    return new Promise((resolve, reject) => {
      requestFn({
        ...options,
        success: resolve,
        fail: reject
      });
    });
  };
}

export const promisifyWxRequest = promisifyRequest(wx.request);

// 或者直接导出转换后的wx.request
export default promisifyWxRequest;