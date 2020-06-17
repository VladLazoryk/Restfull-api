const ProductController = require('./product');
const UserController = require('./user');

module.exports = {
  ProductCtrl: new ProductController(),
  UserCtrl: new UserController()
};
