// routes/staffRoutes.js
const express = require('express');
const {
    createStaff, getStaffs, getStaffById, updateStaff, deleteStaff
} = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorizeMiddleware');

const router = express.Router();

// Áp dụng protect và authorize('admin') cho tất cả các route staff
router.use(protect, authorize('admin'));

// /api/staff/
router.route('/')
    .post(createStaff) // POST /api/staff
    .get(getStaffs);   // GET /api/staff

// /api/staff/:id
router.route('/:id')
    .get(getStaffById)     // GET /api/staff/:id
    .put(updateStaff)      // PUT /api/staff/:id
    .delete(deleteStaff);  // DELETE /api/staff/:id

module.exports = router;
