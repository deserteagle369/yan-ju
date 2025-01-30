const base = require('../../utils/language.js')
const _ = base._

Component({
    data: {
        index: 0,
        language: 'zh_CN',
        array: [
            { value: 'zh_CN', name: _('简体中文') },
            { value: 'zh_TW', name: _('繁体中文') },
            { value: 'en', name: _('英文') },
            { value: 'fr', name: _('法文') },
            { value: 'de', name: _('德文') },
            { value: 'es', name: _('西班牙文') }
        ]
    },
    lifetimes: {
        attached() {
            const language = base.getLanguage()
            let index = this.data.array.findIndex(item => item.value === language);
            index = index === -1 ? 0 : index;  // Default to Simplified Chinese if not found

            this.setData({
                index: index,
                language: language
            });
        }
    },
    methods: {
        bindPickerChange: function (e) {
            this.setData({
                index: e.detail.value,
                language: this.data.array[e.detail.value].value
            });
            this.switchLanguage();
        },
        switchLanguage() {
            wx.setStorageSync('language', this.data.language);
            this.triggerEvent('refreshevent'); // 触发页面刷新，否则当前页语言版本无法更新
        }
    }
})
