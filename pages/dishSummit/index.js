//pages/dishSummit/index.js
const base = require('../../utils/language.js')
const _ = base._
Page({
  data: {
    dishId:'',
    dishName: '',
    openid:'',
    dishNameInput: '', // 菜品名称输入框的值  
    searchedDishes: [], // 搜索到的菜品列表  
    showDropdown: false, // 控制下拉列表是否显示的标志
    dishCategories: ['肉类', '海鲜类', '蔬菜类', '汤类', '冷菜类', '热菜类', '主食类', '甜品和饮料类','水果类','其他类'], // 菜品分类
    selectedIngredients: [], // 存储已选的食材
    time: '',
    spicyLevels: ['不辣', '微辣', '中辣', '辣', '特辣'],
    selectedSpicyLevel: '请选择辣度',
    ingredientsCategories: [[],[],[]], // 初始化空数组，将通过函数填充
    selectedIngredientsIndex: [0, 0, 0], // 默认选中的三级分类索引
    dishImageUrl: '', // 菜品图片URL
    _t: '',
  },
  onLoad:function(options){
    this.mixinFn();
    wx.setNavigationBarTitle({
      title: _('提交菜品')
    })
    // 假设 options 中包含了菜品 ID  
    const dishId = options.dishId; // 从路由或其他方式获取到的菜品ID  
    console.log("dishSummit页面参数dishId:", dishId);
    const app = getApp();    
    // 使用Promise来确保openid被正确设置
    const setOpenId = () => {
      return new Promise((resolve, reject) => {
        const checkOpenId = () => {
          if (app.globalData.openid) {
            this.setData({
              openid: app.globalData.openid
            });
            console.log("this.data.openid:", this.data.openid);
            resolve();
          } else {
            console.log("Waiting for openid...");
            setTimeout(checkOpenId, 100); // 每100ms检查一次
          }
        };
        checkOpenId();
      })
    };
  
    // 使用async/await来处理异步操作
    const initializePageData = async () => {
      try {
        console.log("Starting initializePageData");
        await setOpenId();
        console.log("OpenId set successfully");
        if (dishId) {
          console.log("Fetching dish details:",dishId);
          await this.getDishDetail(dishId);
        } else {
          // 初始化为新建菜品的界面
          console.log("Initializing new dish form");
          this.initializeNewDishForm();
        }
        
        // 假设这个函数是你用来初始化食材分类数据的
        console.log("Initializing cooking times");
        this.initializeCookingTimes();
        console.log("Initializing ingredients categories");
        await this.initIngredientsCategories();
        console.log('Ingredients categories initialized successfully.');
      } catch (err) {
        console.error('Error initializing page data:', err);
      }
    };
    // 调用初始化函数
    initializePageData().then(() => {
      console.log("Page initialization complete");
    }).catch(err => {
      console.error("Error during page initialization:", err);
    });
    // 获取事件通道
    const eventHandler = this.getOpenerEventChannel();
    if (eventHandler && typeof eventHandler.on === 'function') {
      eventHandler.on('acceptDataFromOpenerPage', (data) => {
        console.log("Received data from opener page:", data);
        if (data && data.dishId) {
          this.setData({
            dishId: data.dishId
          });
        } else {
          console.error("No valid dishId received from opener page");
        }
      });
      // 保存刷新页面的回调
      this.refreshPage = () => {
        eventHandler.emit('refreshPage');
        };
    } else {
      console.log('EventChannel not available or initialized');
      // 如果没有事件通道，可以考虑使用其他方式初始化数据
      if (options.dishId) {
        this.setData({
          dishId: options.dishId
        });
        console.log("this.data.dishId:", this.data.dishId);
      }
    }
  },
  
  refresh() {
    this.onLoad()
  },
  mixinFn() {
    this.setData({
      _t: base._t()
    })
  },

  initializeNewDishForm: function() {
    // 初始化新菜品的表单数据
    this.setData({
      dishName: '',
      dishCategory: '',
      selectedIngredients: [],
      selectedSpicyLevel: '请选择辣度',
      time: '',
      dishImageUrl: ''
    });
    console.log("Initialized new dish form.");
  },
  getDishDetail: function(dishId) {    
    console.log("start getDishDetail with:", dishId);  
    // 使用箭头函数来保持this的上下文
    const db = wx.cloud.database();  
    wx.cloud.callFunction({    
      name: 'cloudGetDishById', // 云函数名称    
      data: { dishIds: [dishId]}, // // 即使是单个ID也作为数组传递
      success: res => {  
        // 假设 res.result 是从云函数返回的数据  
        console.log('收到云函数cloudGetDishById返回结果:', res.result);
        const dishDetails = res.result.data[0];
        console.log('结果中的dishDetails:', dishDetails);
        console.log('结果中的openid:', dishDetails.openid);
        this.setData({
          dishId: dishDetails._id,  
          dishName: dishDetails.dishName,  
          dishCategory: dishDetails.dishCategory,  
          selectedSpicyLevel: dishDetails.selectedSpicyLevel,  
          time: dishDetails.time,  
          dishImageUrl: dishDetails.dishImageUrl,  
          createdAt: dishDetails.createdAt,
          lastUpdatedAt: dishDetails.lastUpdatedAt,
          isOwner: dishDetails.openid === this.data.openid, // 判断当前用户是否为菜品提交者
          authorId: dishDetails.openid.slice(-4), // 获取openid的后四位作为作者ID  
          authorAvatarUrl: dishDetails.avatarUrl || '', // 获取用户头像的URL  
        });  
        console.log("getDishDetail更新的this.data:", this.data);
        // 解析食材ID以获取详细信息
        const ingredientIds = dishDetails.selectedIngredients;
        console.log("Selected ingredients IDs before fetch:", ingredientIds);
        db.collection('ingredients').where({
          _id: db.command.in(ingredientIds)
          }).get().then(ingRes => {
          const fullIngredients = ingRes.data.map(ing => ({
            selectedIngredientId: ing._id,
            selectedIngredient: ing.Ingredient,
            selectedCategory: ing.Category,
            selectedSubcategory: ing.Subcategory
          }));
          console.log("fullIngredients:", fullIngredients);
          this.setData({
            selectedIngredients: fullIngredients
          });
          }).catch(err => {
          console.error('获取食材详情失败:', err);
        });
      },
      fail: err => {  
        console.error('Error fetching dish detail:', err);  
        wx.showToast({  
          title: '获取菜品详情失败',  
          icon: 'none',  
          duration: 2000  
        });  
      }  
    });  
  },  
  inputName(e) {
    this.setData({ dishName: e.detail.value });
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
  clearInput: function() {
    console.log('Clearing input',this.data); // 添加日志输出，检查是否触发
    this.setData({
      dishName: '',
      showDropdown: false, // 同时隐藏下拉列表
      searchedDishes: [] // 可以考虑清空搜索结果，避免显示旧数据
    });
  },
  
  initializeCookingTimes: function() {
    let times = [];
    for (let i = 5; i <= 120; i += 5) {
      times.push(i + '分钟');
    }
    this.setData({
      cookingTimes: times
    });
    console.log(this.data.selectedIngredientsIndex)
  },

  ondishCategoryChange: function(e) {
    this.setData({
      dishCategory: this.data.dishCategories[e.detail.value]
    });
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
         console.log('跳转到菜品详情页成功');
         },
       fail: function(res) {
         console.log('跳转到菜品详情页失败', res);
       }
     });
    } else {
      console.error('dishId not found or is empty');
    }  
  },

  async initIngredientsCategories() {
    const db = wx.cloud.database();
  
    try {
      // 获取所有一级分类
      const firstLevelResult = await db.collection('ingredients')
        .aggregate()
        .group({
          _id: '$Category'
        })
        .end();
  
      const firstLevelCategories = firstLevelResult.list.map(item => item._id);
      console.log('一级分类:', firstLevelCategories);
  
      // 初始化数据结构
      let categoryData = {
        categories: firstLevelCategories,
        subcategories: {},
        ingredients: {},
        ingredientDetails: {} // 用于存储具体食材的id和name
      };
  
      // 对每个一级分类，获取其对应的二级分类
      for (const category of firstLevelCategories) {
        const secondLevelResult = await db.collection('ingredients')
          .aggregate()
          .match({ Category: category })
          .group({
            _id: '$Subcategory'
          })
          .end();
  
        categoryData.subcategories[category] = secondLevelResult.list.map(item => item._id);
        console.log('二级分类:', categoryData.subcategories[category]);
  
        // 对每个二级分类，获取其对应的三级分类（具体食材）
        for (const subcategory of categoryData.subcategories[category]) {
          const thirdLevelResult = await db.collection('ingredients')
            .aggregate()
            .match({
              Category: category,
              Subcategory: subcategory
            })
            .group({
              _id: '$Ingredient',
              id: { $first: '$_id' } // 获取食材的 _id
            })
            .end();
  
          const key = `${category}-${subcategory}`;
          categoryData.ingredients[key] = thirdLevelResult.list.map(item => item._id);
          categoryData.ingredientDetails[key] = thirdLevelResult.list.map(item => ({
              id: item.id,
              name: item._id
          }));
  
          // 打印三级分类的食材数据
          console.log('三级分类：', categoryData.ingredients[key]);
        }
      }
  
      // 将分类数据设置到页面数据中
      this.setData({
        ingredientsCategories: [categoryData.categories, [], []],
        allSubcategories: categoryData.subcategories,
        allIngredients: categoryData.ingredients,
        allIngredientDetails: categoryData.ingredientDetails
      });
      console.log('所有分类数据this.data:', this.data);
    } catch (err) {
      console.error('Error initializing ingredients categories:', err);
      throw new Error('Error fetching or processing ingredients categories:', err);
    }
  },

  onPickIngredient: function(e) {
    const { value } = e.detail;
    const category = this.data.ingredientsCategories[0][value[0]];
    const subcategory = this.data.ingredientsCategories[1][value[1]];
    const ingredientDetail = this.data.allIngredientDetails[`${category}-${subcategory}`][value[2]];

    let newSelectedIngredients = this.data.selectedIngredients.slice();
    newSelectedIngredients.push({
        selectedCategory: category,
        selectedSubcategory: subcategory,
        selectedIngredient: ingredientDetail.name,
        selectedIngredientId: ingredientDetail.id // 存储id以便于后续处理
    });

    this.setData({ selectedIngredients: newSelectedIngredients });
  },
  onColumnChange: function(e) {
    const { column, value } = e.detail;
    let categories = this.data.ingredientsCategories;
    let selectedIndexes = this.data.selectedIngredientsIndex;
    selectedIndexes[column] = value;

    if (column === 0) { // 如果是第一列（一级分类）变化
        const selectedCategory = categories[0][value];
        // 使用已初始化的二级分类数据
        const subcategories = this.data.allSubcategories[selectedCategory] || [];
        // 更新二级分类和重置三级分类
        categories[1] = subcategories;
        categories[2] = [];
        this.setData({
            ingredientsCategories: categories,
            selectedIngredientsIndex: [value, 0, 0] // 重置后两列的选择
        });
    } else if (column === 1) { // 如果是第二列（二级分类）变化
        const selectedSubcategory = categories[1][value];
        // 获取对应的三级分类
        const selectedCategory = categories[0][selectedIndexes[0]];
        const key = `${selectedCategory}-${selectedSubcategory}`;
        const ingredients = this.data.allIngredients[key] || [];
        categories[2] = ingredients;
        this.setData({
            ingredientsCategories: categories,
            selectedIngredientsIndex: [selectedIndexes[0], value, 0] // 重置第三列的选择
        });
    }
    // 更新已选择索引
    this.setData({ selectedIngredientsIndex: selectedIndexes });
  },

  removeIngredient: function(e) {
    const index = e.currentTarget.dataset.index;
    let newSelectedIngredients = this.data.selectedIngredients.slice();
    newSelectedIngredients.splice(index, 1);
    this.setData({ selectedIngredients: newSelectedIngredients });
  },

  pickSpicy(e) {
    this.setData({
      selectedSpicyLevel: this.data.spicyLevels[e.detail.value]
    });
  },
  bindTimeChange: function(e) {
    const selectedTime = this.data.cookingTimes[e.detail.value];
    this.setData({
        time: selectedTime
      });
  },
  chooseAndCropImage: function() {
    const that = this;
    wx.chooseImage({
        count: 1, // 默认为1
        sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
        sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
        success(res) {
            // 返回选定照片的本地文件路径列表
            const tempFilePaths = res.tempFilePaths[0];
            // 导航到裁剪页面，传递图片路径
            wx.navigateTo({
              url: `/pages/cropper/cropper?imgSrc=${tempFilePaths}`
            });
            },
            fail: e => {
                console.error(e)
                wx.showToast({
                    title: '图片上传失败',
                    icon: 'none'
                });
            }
    });
  },
  
  submitDish: function() {
    if (this.data.dishId) {
        // 调用云函数更新现有菜品
        this.updateDish();
    } else {
        // 调用云函数创建新菜品
        this.createDish();
    }
},

// 在 pages/dishDetail/index.js 中
updateDish: function() {
  console.log("启动函数updateDish:", this.data);
  const { dishId, dishName, dishCategory, selectedIngredients, time, selectedSpicyLevel, dishImageUrl, openid } = this.data;
  if (!openid) {
    wx.showToast({
      title: '用户未登录',
      icon: 'none',
      duration: 2000
    });
    return; // 如果没有openid，中断函数执行
  }
  wx.cloud.callFunction({
    name: 'cloudUpdateDish',
    data: {
      dishId,
      dishName,
      dishCategory,
      selectedIngredients: selectedIngredients.map(ing => ing.selectedIngredientId),
      time,
      selectedSpicyLevel,
      dishImageUrl,
      openid
    },
    success: res => {
      console.log('cloudUpdateDish返回结果：',res);
      if (res.result.success) {
        wx.showToast({
          title: '更新成功',
          icon: 'success',
          duration: 2000
        });
        // 考虑在这里加入延时跳转
        setTimeout(() => {
          if (typeof this.refreshPage === 'function') {
            this.refreshPage(); // 调用刷新页面的回调
          } else {
            console.warn('refreshPage is not a function');
          }
          wx.navigateBack();
        }, 2100);
      } else {
        wx.showToast({
          title: '更新失败: ' + res.result.errorMessage,
          icon: 'none',
          duration: 2000
        });
      }
    },
    fail: err => {
      wx.showToast({
        title: '调用云函数cloudUpdateDish失败',
        icon: 'none',
        duration: 2000
      });
      console.error('调用云函数cloudUpdateDish失败：', err);
    }
  });
},

  createDish: function() {
      // 提交菜品信息的逻辑
      console.log(this.data);
      // 提取仅包含食材ID的数组
      const ingredientIDs = this.data.selectedIngredients.map(ing => ing.selectedIngredientId);
      console.log("Selected ingredients IDs before submit:", ingredientIDs);
      // 确保所有字段都已填写
      if (this.data.dishName && this.data.dishCategory && ingredientIDs.length && this.data.time && this.data.selectedSpicyLevel && this.data.dishImageUrl) {
          // 此处调用云函数提交数据
          wx.cloud.callFunction({
              name: 'cloudCreateDish',
              data: {
                  dishName: this.data.dishName,
                  dishCategory: this.data.dishCategory,
                  selectedIngredients: ingredientIDs,
                  time: this.data.time,
                  selectedSpicyLevel: this.data.selectedSpicyLevel,
                  dishImageUrl: this.data.dishImageUrl,
                  openid: this.data.openid
              },
              success: function(res) {
                  wx.showToast({
                      title: '提交成功',
                  });
              },
              fail: function(err) {
                  wx.showToast({
                      title: '提交失败',
                      icon: 'none',
                  });
                  console.error('调用失败：', err);
              }
          });
      } else {
          wx.showToast({
              title: '请填写所有信息',
              icon: 'none',
          });
      }
  },

  onShow: function () {
    // 从全局变量获取裁剪后的图片
    const app = getApp();
    if (app.globalData.imgSrc) {
      const filePath = app.globalData.imgSrc;
      const cloudPath = `dishImages/${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}.png`;
  
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath, // 文件路径
        success: res => {
          // get resource ID
          console.log('上传成功', res.fileID);
          this.setData({
            dishImageUrl: res.fileID // 设置页面图片为云存储路径
          });
        },
        fail: err => {
          console.error('上传失败', err);
          wx.showToast({
            title: '图片上传失败',
            icon: 'none'
          });
        }
      });
  
      // 清理全局变量，防止重复使用
      app.globalData.imgSrc = null;
    }
  },
})