const User = require('../models/user');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');

// GET /api/admin/users?page=1&limit=20
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:id
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id/role
exports.updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be user or admin' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Clean up user data
    await Promise.all([
      Portfolio.deleteOne({ user: req.params.id }),
      Transaction.deleteMany({ user: req.params.id }),
    ]);

    res.json({ success: true, message: 'User and associated data deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalTransactions, adminCount] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      User.countDocuments({ role: 'admin' }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalTransactions,
        adminCount,
        regularUsers: totalUsers - adminCount,
      },
    });
  } catch (err) {
    next(err);
  }
};
