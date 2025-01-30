// behaviors/localizable.js
module.exports = Behavior({
  data: {
    _t: {}
  },
  methods: {
    initLanguage: function() {
      this.setData({
        _t: require('../utils/language.js').getTranslations()
      });
    }
  }
});
