// 云函数：getSecondLevelCategories
const cloud = require('wx-server-sdk')
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
    try {
        const db = cloud.database()
        const $ = db.command.aggregate
        const result = await db.collection('ingredients').aggregate()   
            .group({
                _id: '$Subcategory',
                SubcategoryName: $.first('$Subcategory'),
                SubcategoryId: $.first('$_id'),
            })
            .project({
                _id: 0,
                SubcategoryId: '$_id',
                SubcategoryName: '$SubcategoryName',
            })
            .end();
        return result.list
        console.log("云函数getSecondLevelCategories返回的result:",result); // 云函数getSecondLevelCategories返回的result.list
    } catch (e) {
        console.error(e)
        return []
    }
}