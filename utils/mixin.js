// utils/mixin.js
const language = require('./language.js'); // 引入语言模块

module.exports = {
  data: {
    _t: {},
  },
  onLoad: function(options) {
    this.initLanguage();
  },
  initLanguage: function() {
    this.setData({
      _t: language.getTranslations() // 假设这个方法返回所有翻译文本
    });
  }
};
