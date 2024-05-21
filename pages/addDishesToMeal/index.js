Page({
  data: {
    searchText: '',
    categories: [],
    noResults: false,
    searchedDishes: [],
  },

  onLoad: function() {
    this.getCategories();
  },

  onSearchInput: function(e) {
    const searchText = e.detail.value;
    this.setData({ searchText });
    this.searchDishes(searchText);
  },

  searchDishes: function(searchText) {
    wx.cloud.callFunction({
      name: 'dishes',
      data: {
        action: 'searchDishes',
        searchText: searchText,
      },
    }).then(res => {
      const dishes = res.result;
      if (dishes.length === 0) {
        this.setData({ noResults: true, searchedDishes: [] });
      } else {
        this.setData({ noResults: false, searchedDishes: dishes });
      }
    }).catch(err => {
      console.error('Failed to search dishes:', err);
    });
  },

  getCategories: function() {
    wx.cloud.callFunction({
      name: 'dishes',
      data: {
        action: 'getCategories',
      },
    }).then(res => {
      this.setData({ categories: res.result });
    }).catch(err => {
      console.error('Failed to get categories:', err);
    });
  },

  addDishToMeal: function(e) {
    const selectedDish = e.currentTarget.dataset.dish;
    // Here you can add the selected dish to the meal
    // This could involve another cloud function call or local state update
  },

  redirectToSubmit: function() {
    wx.navigateTo({
      url: '/pages/dishSubmit/index',
    });
  },
});
