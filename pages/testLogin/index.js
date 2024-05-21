// pages/testLogin/index.js
Page({
  testLogin: function() {
    wx.login({
      success: function(res) {
        if (res.code) {
          console.log("登录成功，获取到的code:", res.code);
          // 这里可以继续调用云函数来获取openid和session_key
        } else {
          console.error("登录失败：", res.errMsg);
        }
      },
      fail: function(err) {
        console.error("登录调用失败：", err);
      }
    });
  },
  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})