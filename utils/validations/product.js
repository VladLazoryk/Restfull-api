const { check } = require('express-validator');

const validation = {
  create: [
    check('size').isLength({ min: 1, max: 48 }),
    check('price').isInt({ min: 0, max: 200000 }),
    check('description').isLength({ min: 3, max: 100 }),
    check('type').isLength({ min: 3, max: 50 }),
    check('sold').isBoolean(),
    check('patient').isLength({ min: 3, max: 50 }),
    check('price').isInt({ min: 0, max: 200000 }),,
    check('likes').isInt({ min: 0, max: 200000 }),
    check('images').isLength({ min: 0, max: 200000 }),

  ]
};

module.exports = validation;
 
