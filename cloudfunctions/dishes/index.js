const cloud = require('wx-server-sdk');

cloud.init({
  // Assuming you're using your cloud's default environment
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// Function to search dishes based on a search text
async function searchDishes(searchText) {
  try {
    const searchResult = await db.collection('dishes')
      .where({
        // Assuming 'name' is a field in your dishes collection
        // Adjust the condition based on your actual needs and data schema
        dishName: db.RegExp({
          regexp: searchText,
          options: 'i', // Case-insensitive search
        }),
      })
      .get();
    return searchResult.data;
  } catch (err) {
    console.error('searchDishes error: ', err);
    return [];
  }
}

// Function to get all categories
async function getCategories() {
  try {
    const categoryResult = await db.collection('categories').get();
    return categoryResult.data;
  } catch (err) {
    console.error('getCategories error: ', err);
    return [];
  }
}

exports.main = async (event, context) => {
  switch (event.action) {
    case 'searchDishes':
      return await searchDishes(event.searchText);
    case 'getCategories':
      return await getCategories();
    default:
      return {
        message: 'Invalid action',
      };
  }
};
