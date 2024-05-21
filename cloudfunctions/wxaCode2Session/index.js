// 云函数入口文件
require('dotenv').config(); // 加载环境变量
console.log("启动云函数wxaCode2Session")
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 表示在当前云环境中操作
});

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const code = event.code
    if (!code) {
      return {
        error: 1,
        msg: 'code不能为空'
      }
    }

    // 在微信小程序的云开发中获取环境变量中的appId和appSecret
    // const appId = cloud.env.WX_APPID;
    // const secret = cloud.env.WX_SECRET;
    const appId = process.env.APPID;
    const secret = process.env.APPSECRET;
    console.log('Accessing environment variables:');
    console.log('APP_ID:', appId);
    console.log('SECRET:', secret);
    if (!appId || !secret) {
      return {
        error: 2,
        msg: '未配置APPID或APPSECRET'
      }
    }

    // 构造请求微信服务器的URL
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`

    // 打印完整请求URL
    console.log('Request URL:', url);

    // 发送请求到微信服务器
    const res = await cloud.request({
      url: url,
      method: 'GET'
    })

    // 检查响应状态码
    if (res.statusCode !== 200) {
      return {
        error: res.statusCode,
        msg: '请求微信服务器失败'
      }
    }

    // 解析返回的数据
    const data = res.data
    console.log("data:", data)
    if (data.errcode === 0) {
      // 返回openid和session_key
      console.log("openid:", data.openid, "session_key:", data.session_key)
      return {
        openid: data.openid,
        session_key: data.session_key
      }
    } else {
      // 返回错误信息
      return {
        error: data.errcode,
        msg: data.errmsg
      }
    }
  } catch (error) {
    // 处理异常
    console.error('Server error:', error.message);
    return {
      error: -1,
      msg: '服务器内部错误'
    }
  }
}