// pages/discover/index.js
const base = require('../../utils/language.js')
const _ = base._
Page({
  data: {
    weChatId: "zhang_jian_cn",  // 这里替换成你的微信号
    _t: ''
  },

  onLoad: function(options) {
    this.mixinFn();
    wx.setNavigationBarTitle({
      title: _('发现')
    })
  },
  
  refresh() {
    this.onLoad()
  },
  mixinFn() {
    this.setData({
      _t: base._t()
    })
  },
  // 复制微信号到剪贴板
  copyWeChatId: function() {
    wx.setClipboardData({
      data: this.data.weChatId,
      success: function() {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success',
          duration: 2000
        });
      },
      fail: function() {
        wx.showToast({
          title: '复制失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  }
});
