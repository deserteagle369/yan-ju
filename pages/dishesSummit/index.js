//pages/dishSummit/index.js
const app = getApp();  
Page({
  data: {
    dishName: '',
    openid:'',
    dishNameInput: '', // 菜品名称输入框的值  
    searchedDishes: [], // 搜索到的菜品列表  
    showDropdown: false, // 控制下拉列表是否显示的标志
    categories: ['肉类', '禽类', '海鲜', '蔬菜', '汤类', '冷菜', '主食', '甜品和饮料'],
    selectedCategory: '',
    selectedIngredients: [],
    time: '',
    spicyLevels: ['不辣', '微辣', '中辣', '辣', '特辣'],
    ingredientsCategories: [[], [], []],
    selectedIngredientsIndex: [0, 0, 0],
    dishImageUrl: '',
    imgSrc: '', // 原始图片地址  
  },

  onLoad: function (options) {
    const dishId = options.dishId || wx.getStorageSync('dishId') || '';
    console.log("onLoad中获取的dishId:",dishId);
    
    let openid = app.globalData.openid;
    console.log("onLoad函数中从缓存中获取的openid：",openid);
    console.log("onLoad函数中从缓存中获取的userInfo：", app.globalData.userInfo);
    if (app.globalData.userInfo) {
      // 如果全局状态中已经有用户信息，则直接设置到页面数据
      this.setData({
        openid,
        userInfo: app.globalData.userInfo || {}
      });
      console.log("app.globalData.userInfo: ",this.data.userInfo);
    } else {
      // 用户信息未获取，调用云函数进行获取
      wx.cloud.callFunction({
        name: 'cloudGetUserProfile',
        data: {
          openid: openid // 确保这里使用的是正确的 openid
        },
        success: (res) => {
          if (res.result.success) {
            // 成功获取用户信息，更新全局状态和页面数据
            const userInfo = res.result.data;
            app.globalData.userInfo = userInfo; // 更新全局状态
            this.setData({
              user: userInfo // 更新页面数据
            });
          } else {
            // 处理错误情况
            console.error('获取用户信息失败：', res.result.error);
            // 这里可以添加一个提示给用户
          }
        },
        fail: (err) => {
          // 处理调用云函数失败的情况
          console.error('调用云函数失败：', err);
          // 这里也可以添加一个提示给用户
        }
      });
    };
    this.initializeCookingTimes();
    this.initIngredientsCategories();
  },

  onShow: function() {  
    // 检查全局变量 app.globalData.imgSrc 是否有新的图片URL  
    if (app.globalData.imgSrc) {  
        // 如果有新的图片URL，更新页面上的图片显示或其他相关逻辑  
        this.setData({  
            'dishImageUrl': app.globalData.imgSrc // 假设你在页面上有一个变量imgSrc来显示图片  
        });  
        console.log("this.data:",this.data); // 确保所有字段都已填写
    }  
},  

    // 处理输入框输入事件  
  onInputChange: function(e) {  
    const dishNameInput = e.detail.value; // 获取输入框的值
    console.log("onInputChange:",dishNameInput)  
    this.setData({  
      dishName: e.detail.value,  
      dishNameInput,  
      showDropdown: dishNameInput.trim().length > 0, // 如果输入不为空，则显示下拉列表  
    }); 
    // 调用搜索函数  
    this.searchDishes(dishNameInput);  
  }, 

  async searchDishes(searchKeyword) {
    console.log("searchDishes关键字:",searchKeyword)
    try {
      const result = await wx.cloud.callFunction({
        name: 'cloudGetDishesByName',
        data: {
          keyword: searchKeyword,
        },
      });
      console.log("收到云端返回结果：",result.result)
      const searchedDishes = result.result || [];
      const hasSearchResult = searchedDishes.length > 0;
      console.log("搜索返回结果searchedDishes:",searchedDishes)
      this.setData({
        searchedDishes,
        hasSearchResult,
      });
    } catch (e) {
      console.error('搜索菜品失败:', e);
      wx.showToast({
        title: '搜索失败，请稍后再试',
        icon: 'none',
        duration: 1500,
      });
    }
  },

  onDishSelected: function(e) {  
    console.log("点击了菜品:",e)
    const dishId = e.currentTarget.dataset.id; // 假设从下拉列表项中获取菜品ID  
    // 显示菜品详情或其他操作
    if (dishId) {
      wx.navigateTo({
        url: '/pages/dishDetail/index?dishId=' + dishId,
       success: function(res) {
         console.log('跳转成功');
         },
       fail: function(res) {
         console.log('跳转失败', res);
       }
     });
    } else {
      console.error('dishId not found or is empty');
    }  
  },

  initializeCookingTimes: function () {
    let times = [];
    for (let i = 5; i <= 120; i += 5) {
      times.push(i + '分钟');
    }
    this.setData({ cookingTimes: times });
    console.log(this.data.selectedIngredientsIndex);
  },

  onCategoryChange: function (e) {
    this.setData({ selectedCategory: this.data.categories[e.detail.value] });
  },

  initIngredientsCategories: function () {
    const db = wx.cloud.database();
    const $ = db.command.aggregate;

    db.collection('ingredients')
      .aggregate()
      .group({
        _id: null,
        distinctCategories: $.addToSet('$Category'),
      })
      .end()
      .then((res) => {
        this.setData({
          ingredientsCategories: [res.list[0].distinctCategories],
        });
      })
      .catch((err) => {
        console.error('Error fetching first-level categories:', err);
      });
  },

  onPickIngredient: function (e) {
    const { value } = e.detail;
    let newSelectedIngredients = this.data.selectedIngredients.slice();
    let newIngredient = {
      category: this.data.ingredientsCategories[0][value[0]],
      subcategory: this.data.ingredientsCategories[1][value[1]],
      name: this.data.ingredientsCategories[2][value[2]],
    };
    newSelectedIngredients.push(newIngredient);
    this.setData({ selectedIngredients: newSelectedIngredients });
  },

  removeIngredient: function (e) {
    const index = e.currentTarget.dataset.index;
    let newSelectedIngredients = this.data.selectedIngredients.slice();
    newSelectedIngredients.splice(index, 1);
    this.setData({ selectedIngredients: newSelectedIngredients });
  },

  onColumnChange: function (e) {
    const { column, value } = e.detail;
    let data = {
      ingredientsCategories: this.data.ingredientsCategories,
      selectedIngredientsIndex: this.data.selectedIngredientsIndex,
    };
    data.selectedIngredientsIndex[column] = value;
    const db = wx.cloud.database();
    if (column === 0) {
      // 当一级分类改变时
      const selectedCategory = this.data.ingredientsCategories[0][value];
      db.collection('ingredients')
        .where({ Category: selectedCategory })
        .get()
        .then((res) => {
          const subcategories = res.data.map((item) => item.Subcategory);
          const newSubcategories = [...new Set(subcategories)];
          data.ingredientsCategories[1] = newSubcategories;
          // 重置后续选择
          data.ingredientsCategories[2] = [];
          data.selectedIngredientsIndex[1] = -1;
          data.selectedIngredientsIndex[2] = -1;
          // 更新食材名称数组
          if (newSubcategories.length > 0) {
            const firstSubcategory = newSubcategories[0];
            db.collection('ingredients')
              .where({
                Subcategory: firstSubcategory,
              })
              .get()
              .then((res) => {
                const ingredients = res.data.map((item) => item.Ingredient);
                data.ingredientsCategories[2] = ingredients;
                this.setData(data);
              });
          } else {
            this.setData(data);
          }
        });
    } else if (column === 1) {
      // 当二级分类改变时
      const selectedSubcategory = data.ingredientsCategories[1][value];
      db.collection('ingredients')
        .where({
          Subcategory: selectedSubcategory,
        })
        .get()
        .then((res) => {
          const ingredients = res.data.map((item) => item.Ingredient);
          data.ingredientsCategories[2] = ingredients;
          // 重置食材选择
          data.selectedIngredientsIndex[2] = -1;
          this.setData(data);
        });
    } else {
      // 如果是其他列改变，目前只有三列，所以不需要额外逻辑
      this.setData(data);
    }
  },

  pickSpicy: function (e) {
    this.setData({ selectedSpicyLevel: this.data.spicyLevels[e.detail.value] });
  },

  bindTimeChange: function (e) {
    const selectedTime = this.data.cookingTimes[e.detail.value];
    this.setData({ time: selectedTime });
  },
  chooseAndCropImage: function() {  
    wx.chooseImage({  
      count: 1, // 默认9  
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有  
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有  
      success: (res) => {  
        // 假设用户只选择了一张图片  
        const tempFilePaths = res.tempFilePaths;  
        if (tempFilePaths.length > 0) {  
          // 导航到cropper页面，并传递图片路径作为参数  
          wx.navigateTo({  
            url: '/pages/cropper/cropper?imgSrc=' + encodeURIComponent(tempFilePaths[0])  
          });  
        }  
      },  
      fail: (err) => {  
        // 处理选择图片失败的情况  
        wx.showToast({  
          title: '选择图片失败',  
          icon: 'none'  
        });  
      }  
    });  
  },  
  async submitDish() {
    // 提交菜品信息的逻辑
    if (
      this.data.dishName &&
      this.data.selectedCategory &&
      this.data.selectedIngredients &&
      this.data.time &&
      this.data.selectedSpicyLevel &&
      this.data.dishImageUrl &&
      this.data.user.openid
    ) {

      // 上传图片到云存储
      // const fileID = await uploadImageToCloud(compressedPath);
      const dbResponse = await wx.cloud.callFunction({
        name: 'cloudCreateDish',
        data: {
          dishName: this.data.dishName,
          selectedCategory: this.data.selectedCategory,
          selectedIngredients: this.data.selectedIngredients,
          time: this.data.time,
          selectedSpicyLevel: this.data.selectedSpicyLevel,
          dishImageUrl: this.data.dishImageUrl,
          openid: this.data.user.openid,
        },
        success: function (res) {
          wx.showToast({
            title: '提交成功',
          });
        },
        fail: function (err) {
          wx.showToast({
            title: '提交失败',
            icon: 'none',
          });
          console.error('调用失败：', err);
        },
      });
    } else {
      wx.showToast({
        title: '请填写所有信息',
        icon: 'none',
      });
    }
  },
});