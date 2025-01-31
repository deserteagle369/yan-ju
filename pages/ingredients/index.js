//pages/ingredients/ingredients.js
const base = require('../../utils/language.js');
const _ = base._;
const app = getApp();

Page({
  data: {
    categories: [], // 一级分类
    selectedCategory: null, // 选中的一级分类
    selectedSubcategory: null, // 选中的二级分类
    subcategories: [], // 二级分类
    ingredients: [], // 食材列表
    searchKeyword: '', // 搜索关键词
    searchResults: [], // 搜索结果列表
    newIngredientName: '' // 新食材名称
  },

  async initIngredientsCategories() {
    const db = wx.cloud.database();
    // 获取一级分类
    const firstLevelResult = await db.collection('ingredients').aggregate().group({ _id: '$Category' }).end();
    const firstLevelCategories = firstLevelResult.list.map(item => item._id);

    // 设置一级分类
    this.setData({
      categories: firstLevelCategories
    });
  },

  async updateSubcategories(selectedCategory) {
    const db = wx.cloud.database();
    // 获取对应的二级分类
    const secondLevelResult = await db.collection('ingredients')
      .aggregate()
      .match({ Category: selectedCategory })
      .group({ _id: '$Subcategory' })
      .end();

    const subcategories = secondLevelResult.list.map(item => item._id);
    this.setData({
      selectedCategory,
      subcategories,
      ingredients: [] // 清空食材
    });
  },

  async loadIngredients(subcategory) {
    const db = wx.cloud.database();
    // 获取对应的食材
    const ingredientsResult = await db.collection('ingredients')
      .where({ Subcategory: subcategory })
      .get();

    this.setData({
      ingredients: ingredientsResult.data
    });
  },

  showSubcategories(e) {
    const selectedCategory = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory,
      selectedSubcategory: null, // 清空选中的子分类
      ingredients: [] // 清空食材
    });
    this.updateSubcategories(selectedCategory);
  },

  showIngredients(e) {
    const selectedSubcategory = e.currentTarget.dataset.subcategory;
    this.setData({
      selectedSubcategory
    });
    this.loadIngredients(selectedSubcategory);
  },

  handleSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value.trim() });
  },

  handleSearch() {
    const { searchKeyword } = this.data;
    if (!searchKeyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }

    wx.cloud.callFunction({
      name: 'cloudGetIngredientsByName',
      data: { keyword: searchKeyword }
    }).then(res => {
      const searchResults = res.result.data || [];
      this.setData({ searchResults });

      // 更新分类浏览的选择项
      if (searchResults.length > 0) {
        const firstResult = searchResults[0];
        this.setData({
          selectedCategory: firstResult.Category,
          selectedSubcategory: firstResult.Subcategory
        });
        this.updateSubcategories(firstResult.Category).then(() => {
          this.setData({
            selectedSubcategory: firstResult.Subcategory
          });
          this.loadIngredients(firstResult.Subcategory)
        });
      }
    }).catch(console.error);
  },
  handleIngredientInput(e) {
    this.setData({ newIngredientName: e.detail.value.trim() });
  },

  addIngredientToCategory() {
    const { selectedCategory, selectedSubcategory, newIngredientName } = this.data;
    if (!selectedCategory || !selectedSubcategory) {
      wx.showToast({
        title: '请选择分类和子分类',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (!newIngredientName) {
      wx.showToast({
        title: '请输入食材名称',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    const db = wx.cloud.database();
    db.collection('ingredients').where({
      Category: selectedCategory,
      Subcategory: selectedSubcategory,
      Ingredient: newIngredientName
    }).get().then(res => {
      if (res.data.length > 0) {
        wx.showToast({
          title: '该食材已存在',
          icon: 'none',
          duration: 2000
        });
      } else {
        db.collection('ingredients').add({
          data: {
            Category: selectedCategory,
            Subcategory: selectedSubcategory,
            Ingredient: newIngredientName
          },
          success: () => {
            wx.showToast({
              title: '添加成功',
              icon: 'success',
              duration: 2000
            });
            this.setData({ newIngredientName: '' }); // 清空输入框
            this.loadIngredients(selectedSubcategory); // 刷新食材列表
          },
          fail: () => {
            wx.showToast({
              title: '添加失败',
              icon: 'none',
              duration: 2000
            });
          }
        });
      }
    }).catch(console.error);
  },
  onLoad() {
    this.initIngredientsCategories();
  }
});