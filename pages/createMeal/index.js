Page({
  data: {
    mealName: '',
    date: '',
    deadline: '',
    status:"ongoing"
  },
  onLoad: function() {
    const now = new Date(); // Get the current date and time
    const defaultDate = this.formatDate(now); // Format it as a string
    const defaultDeadline = this.formatTime(new Date(now.getTime() + 1 * 60 * 60 * 1000)); // Add one hour for the default deadline

    this.setData({
      date: defaultDate,
      deadline: defaultDeadline,
    });
  },

  formatDate: function(date) {
    // Formats a Date object into a date string of the format 'YYYY-MM-DD'
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns a zero-based index
    const day = date.getDate();

    return [year, month, day].map(this.formatNumber).join('-');
  },

  formatTime: function(date) {
    // Formats a Date object into a time string of the format 'HH:MM'
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return [hours, minutes].map(this.formatNumber).join(':');
  },

  formatNumber: function(n) {
    // Formats a number into a two-digit string (e.g., '09' instead of '9')
    n = n.toString();
    return n[1] ? n : '0' + n;
  },
  inputMealName: function(e) {
    this.setData({ mealName: e.detail.value });
  },
  bindDateChange: function(e) {
    this.setData({ date: e.detail.value });
  },
  bindTimeChange: function(e) {
    this.setData({ deadline: e.detail.value });
  },
  createMeal: function() {
    // 验证输入数据
    if (!this.data.mealName || !this.data.date || !this.data.deadline) {
      wx.showToast({
        title: '请填写所有信息',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    // Logic to submit data to cloud database
    const db = wx.cloud.database();
    const mealData = {
      mealName: this.data.mealName,
      date: this.data.date,
      deadline: this.data.deadline,
      status: 'ongoing',
      _openid: this.data._openid, // 假设您已经从某处获取了当前用户的_openid
      mealRate: 0 // 初始化评分为 null

      // You can add more fields according to your need
    };

    // Add new meal information to cloud database,if success then navigate to meal detail page
    db.collection('meals').add({
      data: mealData,
    }).then(res => {
      wx.navigateTo({
        url: '../MealDetail/index?id=' + res._id,
      });
    }).catch(console.error);

  },
});
