// 云函数：getFirstLevelCategorie获取集合ingredients中的一级分类Category

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  try {
    const db = cloud.database();
    const $ = db.command;

    // 获取所有一级分类
    const result = await db.collection('ingredients')
      .aggregate()
      .group({
        _id: '$Category',
        CategoryName: $.first('$Category'),
        CategoryId: $.first('$_id'),
      })
      .project({
        _id: 0,
        CategoryId: '$_id',
        CategoryName: '$CategoryName',
      })
      .end();

    return result.list;
    console.log("云函数getFirstLevelCategorie返回的result:",result);
  } catch (e) {
    console.error(e);
    return {
      error: e.errorMessage || e.errMsg || '云函数执行出错'
    };
  }
};
