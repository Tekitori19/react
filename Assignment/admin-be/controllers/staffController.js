// controllers/staffController.js
const asyncHandler = require('express-async-handler');
const Staff = require('../models/Staff');

// @desc    Create a new staff member
// @route   POST /api/staff
// @access  Private/Admin
const createStaff = asyncHandler(async (req, res) => {
    const { username, password, full_name, role, email, phone_number, is_active } = req.body;

    // Validation đầu vào
    if (!username || !password || !full_name || !role || !email) {
        res.status(400); throw new Error('Thiếu các trường bắt buộc: username, password, full_name, role, email');
    }
    if (password.length < 6) { // Ví dụ validation độ dài mật khẩu
         res.status(400); throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    }
    if (!['admin', 'staff'].includes(role)) {
         res.status(400); throw new Error('Vai trò không hợp lệ');
    }


    // Kiểm tra username hoặc email đã tồn tại chưa
    const staffExists = await Staff.findOne({ $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }] });
    if (staffExists) {
        res.status(400); throw new Error('Tên đăng nhập hoặc email đã tồn tại');
    }

    // Tạo staff mới (password sẽ được hash bởi pre-save hook trong Model)
    const staff = new Staff({
         username: username.toLowerCase(),
         password_hash: password, // Truyền plain password vào đây
        full_name,
        role,
        email: email.toLowerCase(),
        phone_number,
        is_active: is_active !== undefined ? is_active : true, // Mặc định active
     });

    const createdStaff = await staff.save();
    // Trả về thông tin staff đã tạo (không bao gồm password_hash)
     res.status(201).json({
         _id: createdStaff._id, username: createdStaff.username, full_name: createdStaff.full_name,
         role: createdStaff.role, email: createdStaff.email, phone_number: createdStaff.phone_number,
        is_active: createdStaff.is_active, createdAt: createdStaff.createdAt
     });
});

// @desc    Get all staff members with pagination
// @route   GET /api/staff
// @access  Private/Admin
const getStaffs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const query = {}; // Có thể thêm filter theo role, status,... ở đây
    // if (req.query.role) query.role = req.query.role;

    const totalStaff = await Staff.countDocuments(query);
    const staff = await Staff.find(query)
        .select('-password_hash') // Luôn loại bỏ hash password
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

    res.json({
        staff: staff, page: page,
        pages: Math.ceil(totalStaff / limit), total: totalStaff
    });
});

// @desc    Get staff member by ID
// @route   GET /api/staff/:id
// @access  Private/Admin
const getStaffById = asyncHandler(async (req, res) => {
    const staff = await Staff.findById(req.params.id).select('-password_hash');
    if (staff) {
        res.json(staff);
    } else {
        res.status(404); throw new Error('Không tìm thấy nhân viên');
    }
});

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private/Admin
const updateStaff = asyncHandler(async (req, res) => {
    const staff = await Staff.findById(req.params.id);
    if (!staff) { res.status(404); throw new Error('Không tìm thấy nhân viên'); }

    const { full_name, role, email, phone_number, is_active, password } = req.body;

    // Kiểm tra email mới nếu có thay đổi
     if (email && email.toLowerCase() !== staff.email) {
         const emailExists = await Staff.findOne({ email: email.toLowerCase(), _id: { $ne: staff._id } });
         if (emailExists) { res.status(400); throw new Error('Email này đã được nhân viên khác sử dụng'); }
         staff.email = email.toLowerCase();
     }

     // Cập nhật các trường khác
     staff.full_name = full_name ?? staff.full_name;
     if (role && ['admin', 'staff'].includes(role)) staff.role = role; // Validate role
     staff.phone_number = phone_number ?? staff.phone_number;
    // Cần kiểm tra cẩn thận khi cập nhật is_active cho tài khoản admin (vd: không cho inactive admin duy nhất)
     staff.is_active = is_active !== undefined ? is_active : staff.is_active;

     // Cập nhật mật khẩu nếu được cung cấp và hợp lệ
     if (password) {
        if(password.length < 6) { res.status(400); throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự'); }
        staff.password_hash = password; // Hook pre-save sẽ hash lại
    }

     const updatedStaff = await staff.save();
     res.json({ // Trả về thông tin đã cập nhật (trừ hash)
        _id: updatedStaff._id, username: updatedStaff.username, full_name: updatedStaff.full_name,
        role: updatedStaff.role, email: updatedStaff.email, phone_number: updatedStaff.phone_number,
        is_active: updatedStaff.is_active, updatedAt: updatedStaff.updatedAt
    });
});

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access  Private/Admin
const deleteStaff = asyncHandler(async (req, res) => {
    const staff = await Staff.findById(req.params.id);
    if (!staff) { res.status(404); throw new Error('Không tìm thấy nhân viên'); }

    // Kiểm tra không cho admin tự xóa chính mình
     if (req.staff && staff._id.equals(req.staff._id)) {
        res.status(400); throw new Error('Không thể xóa tài khoản của chính mình');
     }
     // TODO: Kiểm tra xem đây có phải admin cuối cùng không trước khi xóa?

     await staff.deleteOne(); // Sử dụng deleteOne()
    res.json({ message: 'Nhân viên đã được xóa' });
 });


module.exports = {
    createStaff,
    getStaffs,
    getStaffById,
    updateStaff,
    deleteStaff,
};
