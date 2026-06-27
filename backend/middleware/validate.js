const mongoose = require('mongoose');

// Validate MongoDB ObjectId param
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format: ${req.params.id}`,
    });
  }
  next();
};

// Validate product body (for POST / PUT)
const validateProduct = (req, res, next) => {
  const { name, price, category } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }
  if (price === undefined || price === null) {
    errors.push('price is required');
  } else if (typeof price !== 'number' || price < 0) {
    errors.push('price must be a non-negative number');
  }
  if (!category || typeof category !== 'string') {
    errors.push('category is required');
  }

  if (errors.length > 0) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

module.exports = { validateObjectId, validateProduct };
