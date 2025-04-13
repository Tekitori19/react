require('dotenv').config(); // Load biến môi trường từ file .env
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const asyncHandler = require('express-async-handler'); // Để bắt lỗi async dễ dàng
const { faker } = require('@faker-js/faker'); // Thêm Faker

// --- Cấu hình cơ bản ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:example@localhost:27017/dashboard?authSource=admin'; // Thay bằng connection string của bạn
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_for_testing_only'; // !!! THAY ĐỔI VÀ GIỮ BÍ MẬT !!!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// --- Khởi tạo Express App ---
const app = express();

// --- Middleware cơ bản ---
app.use(cors()); // Cho phép cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// --- Kết nối MongoDB ---
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};
connectDB(); // Gọi hàm kết nối

// --- Định nghĩa Mongoose Schemas & Models ---

// 1. User (Khách hàng)
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    full_name: String,
    phone_number: String,
    address: String,
    is_active: { type: Boolean, default: true }
}, { timestamps: true });
const User = mongoose.model('User', UserSchema);

// 2. Staff (Nhân viên & Admin)
const StaffSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'staff'], default: 'staff' },
    email: { type: String, required: true, unique: true },
    phone_number: String,
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

// Middleware để hash password trước khi lưu (cho Staff)
StaffSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password_hash = await bcrypt.hash(this.password_hash, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method để so sánh password (cho Staff)
StaffSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password_hash);
};
const Staff = mongoose.model('Staff', StaffSchema);

// 3. Product (Sản phẩm)
const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    stock_quantity: { type: Number, required: true, default: 0, min: 0 },
    image_url: String,
    sku: { type: String, unique: true, sparse: true }, // sparse cho phép null unique
    // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }, // Optional
    // updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }, // Optional
}, { timestamps: true });
const Product = mongoose.model('Product', ProductSchema);

// 4. Order (Đơn hàng)
const OrderItemSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // Lưu tên SP lúc mua
    quantity: { type: Number, required: true, min: 1 },
    price_at_purchase: { type: Number, required: true }, // Giá lúc mua
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null }, // Nhân viên xử lý
    order_items: [OrderItemSchema],
    total_amount: { type: Number, required: true },
    status: { type: String, required: true, default: 'pending', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'] },
    shipping_address: { type: String, required: true },
    customer_name: { type: String, required: true }, // Lưu tên KH lúc đặt
    customer_email: { type: String, required: true }, // Lưu email KH lúc đặt
    customer_phone: { type: String }, // Lưu SĐT KH lúc đặt
    payment_method: String,
    payment_status: { type: String, required: true, default: 'pending', enum: ['pending', 'paid', 'failed'] },
    notes: String,
    order_date: { type: Date, default: Date.now },
}, { timestamps: true });
const Order = mongoose.model('Order', OrderSchema);


// --- Middleware Xác thực & Phân quyền ---

// Middleware kiểm tra JWT (Protect)
const protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            // Gắn thông tin staff vào request (loại bỏ password)
            req.staff = await Staff.findById(decoded.staffId).select('-password_hash');
            if (!req.staff || !req.staff.is_active) {
                res.status(401); throw new Error('Not authorized, staff inactive or not found');
            }
            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            res.status(401); throw new Error('Not authorized, token failed');
        }
    }
    if (!token) {
        res.status(401); throw new Error('Not authorized, no token');
    }
});

// Middleware kiểm tra Vai trò (Authorize)
const authorize = (...roles) => { // ...roles là mảng các vai trò được phép, vd: authorize('admin'), authorize('admin', 'staff')
    return (req, res, next) => {
        if (!req.staff || !req.staff.role) {
            res.status(401); throw new Error('Not authorized to access this route');
        }
        if (!roles.includes(req.staff.role)) {
            res.status(403); // Forbidden
            throw new Error(`Role '${req.staff.role}' is not authorized to access this route`);
        }
        next();
    };
};

// --- Route Handlers (Controllers Logic) ---

// -- Auth Controller Logic --
const loginStaff = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) { res.status(400); throw new Error('Please provide username and password'); }

    const staff = await Staff.findOne({ username });
    if (staff && staff.is_active && (await staff.matchPassword(password))) {
        const token = jwt.sign({ staffId: staff._id, role: staff.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({
            _id: staff._id, username: staff.username, full_name: staff.full_name,
            email: staff.email, role: staff.role, token: token,
        });
    } else {
        res.status(401); throw new Error('Invalid username or password, or account inactive');
    }
});

const getMe = asyncHandler(async (req, res) => { // Lấy thông tin staff đang đăng nhập
    const staff = await Staff.findById(req.staff._id).select('-password_hash'); // req.staff lấy từ middleware protect
    if (staff) res.json(staff);
    else { res.status(404); throw new Error('Staff not found'); }
});


// -- Staff Controller Logic (Admin only) --
const createStaff = asyncHandler(async (req, res) => {
    const { username, password, full_name, role, email, phone_number, is_active } = req.body;
    // Basic validation
    if (!username || !password || !full_name || !role || !email) {
        res.status(400); throw new Error('Missing required fields for staff');
    }
    const staffExists = await Staff.findOne({ $or: [{ username }, { email }] });
    if (staffExists) { res.status(400); throw new Error('Username or email already exists'); }

    const staff = new Staff({ username, password_hash: password, full_name, role, email, phone_number, is_active });
    const createdStaff = await staff.save(); // password sẽ được hash tự động bởi pre-save hook
    res.status(201).json({ // Không trả về password_hash
        _id: createdStaff._id, username: createdStaff.username, full_name: createdStaff.full_name,
        role: createdStaff.role, email: createdStaff.email, phone_number: createdStaff.phone_number,
        is_active: createdStaff.is_active, createdAt: createdStaff.createdAt
    });
});

const getStaffs = asyncHandler(async (req, res) => { // Nhớ đây là API cho Admin
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // Filter nếu cần
    const query = {};
    // if (req.query.role) query.role = req.query.role;

    const totalStaff = await Staff.countDocuments(query);
    const staff = await Staff.find(query)
        .select('-password_hash') // Luôn ẩn password hash
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

    res.json({
        staff: staff, // Backend trả về key là 'staff'
        page: page,
        pages: Math.ceil(totalStaff / limit),
        total: totalStaff
    });
});

const getStaffById = asyncHandler(async (req, res) => {
    const staff = await Staff.findById(req.params.id).select('-password_hash');
    if (staff) res.json(staff);
    else { res.status(404); throw new Error('Staff not found'); }
});

const updateStaff = asyncHandler(async (req, res) => {
    const staff = await Staff.findById(req.params.id);
    if (!staff) { res.status(404); throw new Error('Staff not found'); }

    const { full_name, role, email, phone_number, is_active, password } = req.body;
    staff.full_name = full_name ?? staff.full_name;
    staff.role = role ?? staff.role;
    staff.email = email ?? staff.email; // Cần kiểm tra unique nếu thay đổi email
    staff.phone_number = phone_number ?? staff.phone_number;
    staff.is_active = is_active ?? staff.is_active;

    // Chỉ cập nhật và hash password nếu được cung cấp
    if (password) {
        staff.password_hash = password; // Hook pre-save sẽ hash nó
    }

    // Cần kiểm tra xem email mới (nếu có) đã tồn tại chưa
    if (email && email !== staff.email) {
        const emailExists = await Staff.findOne({ email: email });
        if (emailExists) {
            res.status(400);
            throw new Error('Email already in use by another staff member');
        }
    }


    const updatedStaff = await staff.save();
    res.json({ // Không trả về password hash
        _id: updatedStaff._id, username: updatedStaff.username, full_name: updatedStaff.full_name,
        role: updatedStaff.role, email: updatedStaff.email, phone_number: updatedStaff.phone_number,
        is_active: updatedStaff.is_active, updatedAt: updatedStaff.updatedAt
    });
});

const deleteStaff = asyncHandler(async (req, res) => {
    const staff = await Staff.findById(req.params.id);
    if (staff) {
        if (staff._id.equals(req.staff._id)) {
            res.status(400);
            throw new Error('Cannot delete your own admin account');
        }
        // === THAY ĐỔI Ở ĐÂY ===
        await staff.deleteOne(); // Sử dụng deleteOne() thay vì remove()
        // =======================
        res.json({ message: 'Staff removed' });
    } else {
        res.status(404); throw new Error('Staff not found');
    }
});

// -- Product Controller Logic --
const getProducts = asyncHandler(async (req, res) => {
    const { searchTerm, sortBy, sortOrder, page = 1, limit = 10 } = req.query;
    const query = {};
    if (searchTerm) {
        query.name = { $regex: searchTerm, $options: 'i' }; // Tìm kiếm không phân biệt hoa thường
    }
    const sortOptions = {};
    if (sortBy) {
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
        sortOptions.createdAt = -1; // Mặc định mới nhất
    }

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
        products,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit)),
        total: count
    });
});

const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) res.json(product);
    else { res.status(404); throw new Error('Product not found'); }
});

const createProduct = asyncHandler(async (req, res) => {
    const { name, price, description, image_url, stock_quantity, sku } = req.body;
    if (!name || price == null || stock_quantity == null) {
        res.status(400); throw new Error('Name, price, and stock quantity are required');
    }
    if (sku) {
        const skuExists = await Product.findOne({ sku });
        if (skuExists) { res.status(400); throw new Error('SKU already exists'); }
    }

    const product = new Product({ name, price, description, image_url, stock_quantity, sku /*, createdBy: req.staff._id */ });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});

const updateProduct = asyncHandler(async (req, res) => {
    const { name, price, description, image_url, stock_quantity, sku } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404); throw new Error('Product not found'); }

    product.name = name ?? product.name;
    product.price = price ?? product.price;
    product.description = description ?? product.description;
    product.image_url = image_url ?? product.image_url;
    product.stock_quantity = stock_quantity ?? product.stock_quantity;
    product.sku = sku ?? product.sku;
    // product.updatedBy = req.staff._id;

    // Kiểm tra SKU unique nếu thay đổi và có giá trị
    if (sku && sku !== product.sku) {
        const skuExists = await Product.findOne({ sku: sku, _id: { $ne: product._id } }); // Tìm sku khác với id hiện tại
        if (skuExists) { res.status(400); throw new Error('SKU already exists for another product'); }
    }


    const updatedProduct = await product.save();
    res.json(updatedProduct);
});

const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        // === THAY ĐỔI Ở ĐÂY ===
        await product.deleteOne(); // Sử dụng deleteOne() thay vì remove()
        // =======================
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// -- User Controller Logic --
const getUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // Filter nếu cần (ví dụ: theo is_active, searchTerm)
    const query = {};
    // if (req.query.isActive !== undefined) query.is_active = req.query.isActive === 'true';
    // if (req.query.search) {
    //     query.$or = [
    //         { username: { $regex: req.query.search, $options: 'i' } },
    //         { email: { $regex: req.query.search, $options: 'i' } },
    //         { full_name: { $regex: req.query.search, $options: 'i' } }
    //     ];
    // }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
        .sort({ createdAt: -1 }) // Mới nhất trước
        .limit(limit)
        .skip(skip);

    res.json({
        users: users,
        page: page,
        pages: Math.ceil(totalUsers / limit),
        total: totalUsers
    });
});

const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) res.json(user);
    else { res.status(404); throw new Error('User not found'); }
});

const updateUserStatus = asyncHandler(async (req, res) => { // Ví dụ: cập nhật active/inactive
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('User not found'); }
    const { is_active } = req.body;
    if (is_active === undefined) { res.status(400); throw new Error('is_active field is required'); }
    user.is_active = Boolean(is_active);
    const updatedUser = await user.save();
    res.json(updatedUser);
});

const deleteUser = asyncHandler(async (req, res) => { // Chỉ admin xóa user
    const user = await User.findById(req.params.id);
    if (user) {
        // === THAY ĐỔI Ở ĐÂY ===
        await user.deleteOne(); // Sử dụng deleteOne() thay vì remove()
        // =======================
        res.json({ message: 'User removed' });
    } else {
        res.status(404); throw new Error('User not found');
    }
});


// -- Order Controller Logic --
const getOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Trang mặc định là 1
    const limit = parseInt(req.query.limit) || 15; // Số lượng item mỗi trang mặc định là 15
    const skip = (page - 1) * limit;

    // Thêm filter nếu cần (ví dụ: req.query.status)
    const query = {};
    // if (req.query.status) query.status = req.query.status;

    const totalOrders = await Order.countDocuments(query); // Đếm tổng số dựa trên filter
    const orders = await Order.find(query)
        .populate('user_id', 'full_name email')
        .populate('staff_id', 'full_name')
        .sort({ order_date: -1 }) // Sắp xếp theo ngày đặt gần nhất
        .limit(limit)
        .skip(skip);

    res.json({
        orders: orders, // Đổi tên thành orders để khớp frontend cũ hơn
        page: page,
        pages: Math.ceil(totalOrders / limit),
        total: totalOrders
    });
});

const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user_id', 'full_name email phone_number address')
        .populate('staff_id', 'full_name')
        .populate('order_items.product_id', 'name sku'); // Populate tên/sku sp trong items

    if (order) res.json(order);
    else { res.status(404); throw new Error('Order not found'); }
});

const updateOrderStatus = asyncHandler(async (req, res) => { // Cập nhật trạng thái đơn hàng
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404); throw new Error('Order not found'); }

    const { status, payment_status, notes } = req.body; // Cho phép cập nhật cả status, payment_status, notes

    let updated = false;
    if (status && Order.schema.path('status').enumValues.includes(status)) {
        order.status = status;
        updated = true;
    }
    if (payment_status && Order.schema.path('payment_status').enumValues.includes(payment_status)) {
        order.payment_status = payment_status;
        updated = true;
    }
    if (notes !== undefined) { // Cho phép cập nhật note trống
        order.notes = notes;
        updated = true;
    }


    // Gán nhân viên đang thực hiện cập nhật cho đơn hàng này nếu chưa có
    if (!order.staff_id) {
        order.staff_id = req.staff._id;
        updated = true;
    }


    // Thêm logic nghiệp vụ nếu cần (vd: cập nhật stock khi chuyển status thành 'cancelled' hoặc 'delivered')
    // Ví dụ cơ bản khi hủy đơn -> trả lại hàng vào kho
    // if(order.status === 'cancelled' && status === 'cancelled') {
    //     for (const item of order.order_items) {
    //         const product = await Product.findById(item.product_id);
    //         if(product){
    //             product.stock_quantity += item.quantity;
    //             await product.save();
    //         }
    //     }
    // }


    if (updated) {
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(400).json({ message: 'No valid fields to update or invalid status value provided' });
    }

});

const getDateRange = (period) => {
    const end = new Date();
    let start = new Date();
    switch (period) {
        case 'week':
            start.setDate(end.getDate() - 7);
            break;
        case 'month':
            start.setMonth(end.getMonth() - 1);
            break;
        case 'year':
            start.setFullYear(end.getFullYear() - 1);
            break;
        default: // Default là tháng này
            start = new Date(end.getFullYear(), end.getMonth(), 1);
    }
    start.setHours(0, 0, 0, 0); // Bắt đầu từ 0h:00:00
    end.setHours(23, 59, 59, 999); // Kết thúc ngày hiện tại
    return { start, end };
}

// const deleteOrder = asyncHandler(async (req, res) => { // Thường không nên xóa cứng đơn hàng
//     const order = await Order.findById(req.params.id);
//     if (order) {
//         await order.remove();
//         res.json({ message: 'Order removed' });
//     } else {
//         res.status(404); throw new Error('Order not found');
//     }
// });


// --- Định nghĩa Routes ---
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Auth Routes
app.post('/api/auth/login', loginStaff);
app.get('/api/auth/me', protect, getMe);

// Staff Routes (Admin Only)
app.post('/api/staff', protect, authorize('admin'), createStaff);
app.get('/api/staff', protect, authorize('admin'), getStaffs);
app.get('/api/staff/:id', protect, authorize('admin'), getStaffById);
app.put('/api/staff/:id', protect, authorize('admin'), updateStaff);
app.delete('/api/staff/:id', protect, authorize('admin'), deleteStaff);

// Product Routes
app.get('/api/products', protect, authorize('admin', 'staff'), getProducts);
app.post('/api/products', protect, authorize('admin', 'staff'), createProduct);
app.get('/api/products/:id', protect, authorize('admin', 'staff'), getProductById);
app.put('/api/products/:id', protect, authorize('admin', 'staff'), updateProduct);
app.delete('/api/products/:id', protect, authorize('admin'), deleteProduct); // Chỉ admin xóa SP

// User Routes
app.get('/api/users', protect, authorize('admin', 'staff'), getUsers);
app.get('/api/users/:id', protect, authorize('admin', 'staff'), getUserById);
app.put('/api/users/:id/status', protect, authorize('admin', 'staff'), updateUserStatus); // Cập nhật active
app.delete('/api/users/:id', protect, authorize('admin'), deleteUser); // Chỉ admin xóa User (hoặc nên dùng status)

// Order Routes
app.get('/api/orders', protect, authorize('admin', 'staff'), getOrders);
app.get('/api/orders/:id', protect, authorize('admin', 'staff'), getOrderById);
app.put('/api/orders/:id/status', protect, authorize('admin', 'staff'), updateOrderStatus); // Cập nhật status/payment/notes
// app.delete('/api/orders/:id', protect, authorize('admin'), deleteOrder); // Không khuyến khích

// Endpoint: Đếm số lượng đơn hàng theo Status
app.get('/api/dashboard/stats/order-status', protect, authorize('admin', 'staff'), asyncHandler(async (req, res) => {
    const statusCounts = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } } // Đổi tên _id thành status
    ]);
    res.json(statusCounts);
}));
// --- Thêm Endpoint lấy số liệu tổng hợp cho Dashboard Home ---
app.get('/api/dashboard/stats/summary', protect, authorize('admin', 'staff'), asyncHandler(async (req, res) => {
    // Tính toán song song
    const [
        totalRevenueData,
        activeUsers,
        totalOrders,
        pendingOrders,
        lowStockCountResult // Sử dụng kết quả từ pipeline cũ
    ] = await Promise.all([
        // Tổng doanh thu (chỉ tính đơn delivered/shipped và đã paid)
        Order.aggregate([
            { $match: { status: { $in: ['delivered', 'shipped'] }, payment_status: 'paid' } },
            { $group: { _id: null, totalRevenue: { $sum: '$total_amount' } } }
        ]),
        // Số user đang active
        User.countDocuments({ is_active: true }),
        // Tổng số đơn hàng
        Order.countDocuments(),
        // Số đơn hàng đang chờ xử lý
        Order.countDocuments({ status: 'pending' }),
        // Đếm số sản phẩm sắp hết hàng (< 10)
        Product.countDocuments({ stock_quantity: { $lt: 10 } }) // Count trực tiếp hiệu quả hơn aggregate cũ chỉ cho mục đích này
    ]);

    // Lấy giá trị hoặc mặc định là 0
    const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].totalRevenue : 0;

    res.json({
        totalRevenue: totalRevenue,
        activeUsers: activeUsers,
        totalOrders: totalOrders,
        pendingOrders: pendingOrders,
        lowStockProducts: lowStockCountResult // Đổi tên key cho rõ ràng
    });
}));

// Endpoint: Tổng doanh thu và số đơn hàng theo thời gian (vd: 30 ngày qua)
app.get('/api/dashboard/stats/revenue-orders-daily', protect, authorize('admin', 'staff'), asyncHandler(async (req, res) => {
    const { start, end } = getDateRange('month'); // Lấy 30 ngày qua

    // Chỉ tính doanh thu từ đơn hàng đã giao/hoàn thành và đã thanh toán
    const dailyData = await Order.aggregate([
        {
            $match: {
                order_date: { $gte: start, $lte: end },
                // Tùy logic của bạn, ví dụ tính cả đơn 'delivered' và 'shipped' đã paid
                status: { $in: ['delivered', 'shipped', 'processing'] }, // Có thể thay đổi tùy logic
                payment_status: 'paid' // Chỉ tính đơn đã thanh toán
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$order_date" } }, // Nhóm theo ngày
                totalRevenue: { $sum: '$total_amount' },
                orderCount: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }, // Sắp xếp theo ngày tăng dần
        { $project: { date: '$_id', revenue: '$totalRevenue', orders: '$orderCount', _id: 0 } }
    ]);

    res.json(dailyData);
}));


// Endpoint: Đếm sản phẩm theo khoảng tồn kho
app.get('/api/dashboard/stats/product-stock', protect, authorize('admin', 'staff'), asyncHandler(async (req, res) => {
    const stockLevels = await Product.aggregate([
        {
            $group: {
                _id: null, // Nhóm tất cả document
                lowStock: { $sum: { $cond: [{ $lt: ["$stock_quantity", 10] }, 1, 0] } }, // < 10 là low
                mediumStock: { $sum: { $cond: [{ $and: [{ $gte: ["$stock_quantity", 10] }, { $lt: ["$stock_quantity", 50] }] }, 1, 0] } }, // 10-49 là medium
                highStock: { $sum: { $cond: [{ $gte: ["$stock_quantity", 50] }, 1, 0] } } // >= 50 là high
            }
        },
        { $project: { _id: 0, low: '$lowStock', medium: '$mediumStock', high: '$highStock' } }
    ]);
    res.json(stockLevels[0] || { low: 0, medium: 0, high: 0 }); // Trả về object hoặc mặc định 0 nếu không có sp nào
}));


// --- Route tạo dữ liệu mẫu (CẨN THẬN KHI SỬ DỤNG) ---
// app.post('/api/seed', protect, authorize('admin'), asyncHandler(async (req, res) => {
// app.post('/api/seed', asyncHandler(async (req, res) => {
//     console.log('WARNING: Running data seeder. This will DELETE existing data.');
//     try {
//         // 1. Xóa dữ liệu cũ
//         await Order.deleteMany();
//         await Product.deleteMany();
//         await Staff.deleteMany();
//         await User.deleteMany();
//         console.log('Old data destroyed.');
//
//         // 2. Tạo dữ liệu mẫu
//         // Users
//         const sampleUsers = [
//             { username: 'khachhang1', email: 'kh1@example.com', full_name: 'Nguyễn Văn A', phone_number: '0912345678', address: '123 Đường ABC, Quận 1, TP HCM' },
//             { username: 'khachhang2', email: 'kh2@example.com', full_name: 'Trần Thị B', phone_number: '0987654321', address: '456 Đường XYZ, Quận 3, TP HCM', is_active: false },
//         ];
//         const createdUsers = await User.insertMany(sampleUsers);
//
//         // Staff (Password sẽ được hash khi lưu)
//         const sampleStaff = [
//             { username: 'admin', password_hash: 'admin123', full_name: 'Quản Trị Viên', role: 'admin', email: 'admin@shop.com', is_active: true },
//             { username: 'nhanvien1', password_hash: 'staff123', full_name: 'Nhân Viên Bán Hàng 1', role: 'staff', email: 'nv1@shop.com', is_active: true },
//         ];
//         const createdStaff = [];
//         for (const staffMember of sampleStaff) {
//             const newStaff = new Staff(staffMember);
//             createdStaff.push(await newStaff.save());
//         }
//
//         // Products
//         const sampleProducts = [
//             { name: 'Áo Thun Basic Trắng', price: 150000, description: 'Áo thun cotton co giãn 4 chiều', stock_quantity: 50, sku: 'AT001' },
//             { name: 'Quần Jeans Xanh Đậm', price: 450000, description: 'Quần jeans nam dáng slimfit', stock_quantity: 30, sku: 'QJ001' },
//             { name: 'Giày Sneaker Cổ Thấp', price: 700000, description: 'Giày thể thao năng động', stock_quantity: 5, sku: 'GS001' },
//         ];
//         const createdProducts = await Product.insertMany(sampleProducts);
//
//         // Orders
//         const sampleOrders = [
//             {
//                 user_id: createdUsers[0]._id,
//                 staff_id: createdStaff.find(s => s.role === 'staff')?._id,
//                 customer_name: createdUsers[0].full_name, customer_email: createdUsers[0].email, customer_phone: createdUsers[0].phone_number,
//                 shipping_address: createdUsers[0].address,
//                 order_items: [
//                     { product_id: createdProducts[0]._id, name: createdProducts[0].name, quantity: 2, price_at_purchase: createdProducts[0].price },
//                     { product_id: createdProducts[1]._id, name: createdProducts[1].name, quantity: 1, price_at_purchase: createdProducts[1].price }
//                 ],
//                 total_amount: (createdProducts[0].price * 2) + createdProducts[1].price, status: 'processing', payment_method: 'COD', payment_status: 'pending',
//             },
//             {
//                 user_id: createdUsers[1]._id,
//                 staff_id: createdStaff.find(s => s.role === 'admin')?._id,
//                 customer_name: createdUsers[1].full_name, customer_email: createdUsers[1].email, customer_phone: createdUsers[1].phone_number,
//                 shipping_address: 'Địa chỉ giao hàng khác',
//                 order_items: [
//                     { product_id: createdProducts[2]._id, name: createdProducts[2].name, quantity: 1, price_at_purchase: createdProducts[2].price }
//                 ],
//                 total_amount: createdProducts[2].price, status: 'delivered', payment_method: 'Bank Transfer', payment_status: 'paid',
//             },
//         ];
//         const createdOrders = await Order.insertMany(sampleOrders);
//
//         console.log('Sample data imported successfully!');
//         res.status(201).json({
//             message: 'Sample data seeded successfully!', results: {
//                 users: createdUsers.length,
//                 staff: createdStaff.length,
//                 products: createdProducts.length,
//                 orders: createdOrders.length
//             }
//         });
//
//     } catch (error) {
//         console.error('Error seeding data:', error);
//         res.status(500).json({ message: 'Error seeding data', error: error.message });
//     }
// }));

app.post('/api/seed', asyncHandler(async (req, res) => {
    console.log('WARNING: Running data seeder with Faker. This will DELETE existing data.');
    const NUM_USERS = 50;       // Số lượng khách hàng
    const NUM_STAFF = 5;        // Số lượng nhân viên (trừ admin gốc)
    const NUM_PRODUCTS = 100;    // Số lượng sản phẩm
    const NUM_ORDERS = 200;     // Số lượng đơn hàng

    try {
        // 1. Xóa dữ liệu cũ
        await Order.deleteMany();
        await Product.deleteMany();
        await Staff.deleteMany();
        await User.deleteMany();
        console.log('Old data destroyed.');

        // --- 2. Tạo Users ---
        const usersData = [];
        const createdUserIds = [];
        for (let i = 0; i < NUM_USERS; i++) {
            usersData.push({
                username: faker.internet.userName().toLowerCase() + Math.random().toString(16).slice(2, 6), // Thêm số ngẫu nhiên tránh trùng
                email: faker.internet.email().toLowerCase(),
                full_name: faker.person.fullName(),
                phone_number: faker.phone.number(),
                address: faker.location.streetAddress(true), // Địa chỉ đầy đủ
                is_active: faker.datatype.boolean(0.9), // 90% active
            });
        }
        const createdUsers = await User.insertMany(usersData);
        createdUsers.forEach(u => createdUserIds.push(u._id));
        console.log(`${createdUsers.length} Users generated.`);

        // --- 3. Tạo Staff ---
        const staffData = [];
        const createdStaffIds = [];

        // Tạo Admin gốc trước
        const adminPassword = 'admin123';
        const admin = new Staff({
            username: 'admin', password_hash: adminPassword, full_name: 'Quản Trị Viên Chính',
            role: 'admin', email: 'admin@shop.example.com', is_active: true
        });
        const savedAdmin = await admin.save();
        createdStaffIds.push(savedAdmin._id);

        // Tạo một Staff bình thường để test
        const testStaffPassword = 'staff123';
        const testStaff = new Staff({
            username: 'teststaff', password_hash: testStaffPassword, full_name: 'Nhân Viên Test',
            role: 'staff', email: 'teststaff@shop.example.com', is_active: true
        });
        const savedTestStaff = await testStaff.save();
        createdStaffIds.push(savedTestStaff._id);

        // Tạo các Staff thường
        for (let i = 0; i < NUM_STAFF; i++) {
            staffData.push({
                username: `staff_${faker.internet.userName().toLowerCase()}` + Math.random().toString(16).slice(2, 6),
                password_hash: 'staffpass', // Mật khẩu mặc định cho NV tạo ra
                full_name: faker.person.fullName(),
                role: 'staff',
                email: `staff${i}_${faker.internet.email().toLowerCase()}`,
                is_active: faker.datatype.boolean(0.85), // 85% active
            });
        }
        // Dùng vòng lặp để hash password đúng cách
        for (const staffMember of staffData) {
            try {
                const newStaff = new Staff(staffMember);
                const savedStaff = await newStaff.save();
                createdStaffIds.push(savedStaff._id);
            } catch (err) {
                console.warn(`Skipping staff due to potential duplicate key: ${err.message}`); // Bỏ qua nếu trùng username/email
            }
        }
        console.log(`${createdStaffIds.length} Staff generated (including admin).`);


        // --- 4. Tạo Products ---
        const productsData = [];
        const createdProductIds = [];
        const categories = ['Áo', 'Quần', 'Giày', 'Phụ kiện', 'Đồ điện tử', 'Sách', 'Đồ gia dụng']; // Thêm category để tạo tên SP
        for (let i = 0; i < NUM_PRODUCTS; i++) {
            const category = faker.helpers.arrayElement(categories);
            const name = `${category} ${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()} ${i + 1}`;
            productsData.push({
                name: name,
                description: faker.commerce.productDescription(),
                price: faker.number.int({ min: 50000, max: 5000000, precision: 1000 }), // Giá từ 50k - 5tr
                stock_quantity: faker.number.int({ min: 0, max: 200 }), // Tồn kho từ 0-200
                image_url: faker.image.urlLoremFlickr({ category: 'fashion', width: 640, height: 480 }), // Ảnh fake
                sku: faker.string.alphanumeric(8).toUpperCase() + i, // SKU ngẫu nhiên + số thứ tự
            });
        }
        const createdProducts = await Product.insertMany(productsData);
        createdProducts.forEach(p => createdProductIds.push(p._id));
        console.log(`${createdProducts.length} Products generated.`);


        // --- 5. Tạo Orders (Phức tạp hơn) ---
        const ordersData = [];
        const productMap = new Map(); // Lưu trữ SL tồn kho tạm thời để trừ
        createdProducts.forEach(p => productMap.set(p._id.toString(), { stock: p.stock_quantity, price: p.price, name: p.name }));

        for (let i = 0; i < NUM_ORDERS; i++) {
            const randomUser = faker.helpers.arrayElement(createdUsers); // Chọn KH ngẫu nhiên
            const numItems = faker.number.int({ min: 1, max: 4 }); // Mỗi đơn có 1-4 sản phẩm
            const orderItems = [];
            let totalAmount = 0;
            let possibleOrder = true; // Cờ kiểm tra có tạo đơn hàng được không

            for (let j = 0; j < numItems; j++) {
                // Chọn SP ngẫu nhiên còn hàng
                let attempts = 0;
                let selectedProductId = null;
                let selectedProductData = null;

                while (attempts < createdProductIds.length * 2) { // Giới hạn số lần thử
                    const potentialProductId = faker.helpers.arrayElement(createdProductIds).toString();
                    const productInfo = productMap.get(potentialProductId);
                    if (productInfo && productInfo.stock > 0) {
                        selectedProductId = potentialProductId;
                        selectedProductData = productInfo;
                        break;
                    }
                    attempts++;
                }

                if (!selectedProductId) { // Không tìm thấy SP nào còn hàng
                    possibleOrder = false;
                    break; // Không thể thêm item này -> hủy đơn hàng này
                }


                const quantity = faker.number.int({ min: 1, max: Math.min(3, selectedProductData.stock) }); // Mua 1-3 cái, không vượt quá tồn kho

                orderItems.push({
                    product_id: new mongoose.Types.ObjectId(selectedProductId), // Convert back to ObjectId
                    name: selectedProductData.name, // Lưu tên lúc mua
                    quantity: quantity,
                    price_at_purchase: selectedProductData.price // Lưu giá lúc mua
                });
                totalAmount += quantity * selectedProductData.price;

                // Cập nhật tồn kho tạm thời
                productMap.set(selectedProductId, { ...selectedProductData, stock: selectedProductData.stock - quantity });

            } // end for loop items

            if (!possibleOrder || orderItems.length === 0) continue; // Bỏ qua đơn hàng này nếu không có item nào hợp lệ

            // Quyết định trạng thái và các thông tin khác
            const status = faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed']);
            let payment_status = 'pending';
            if (status === 'delivered' || status === 'shipped') {
                payment_status = faker.helpers.arrayElement(['paid', 'pending']); // Có thể shipped nhưng chưa paid (COD)
            } else if (status === 'processing') {
                payment_status = faker.helpers.arrayElement(['paid', 'pending']);
            } else if (status === 'cancelled' || status === 'failed') {
                payment_status = faker.helpers.arrayElement(['failed', 'pending']); // Cancelled/failed thường là chưa paid
            }


            const orderDate = faker.date.between({ from: '2023-01-01T00:00:00.000Z', to: new Date() }); // Đơn hàng trong khoảng 1 năm qua

            ordersData.push({
                user_id: randomUser._id,
                staff_id: faker.helpers.maybe(() => faker.helpers.arrayElement(createdStaffIds.filter(id => id !== admin._id)), { probability: 0.6 }), // 60% có NV xử lý (không phải admin)
                order_items: orderItems,
                total_amount: totalAmount,
                status: status,
                shipping_address: faker.helpers.maybe(() => faker.location.streetAddress(true), { probability: 0.2 }) || randomUser.address, // 20% địa chỉ khác
                customer_name: randomUser.full_name,
                customer_email: randomUser.email,
                customer_phone: randomUser.phone_number,
                payment_method: faker.helpers.arrayElement(['COD', 'Bank Transfer', 'Credit Card', 'E-Wallet']),
                payment_status: payment_status,
                notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.1 }), // 10% có note
                order_date: orderDate,
                createdAt: orderDate, // Ghi đè createdAt để khớp order_date cho biểu đồ
                updatedAt: faker.date.between({ from: orderDate, to: new Date() }), // updatedAt sau orderDate
            });

        } // end for loop orders

        const createdOrders = await Order.insertMany(ordersData);
        console.log(`${createdOrders.length} Orders generated.`);


        // --- 6. Cập nhật số lượng tồn kho thực tế trong DB ---
        // Đây là bước quan trọng nhưng có thể chậm nếu nhiều sản phẩm
        console.log("Updating actual product stock quantities in DB...");
        let updatedStockCount = 0;
        for (const [productId, productInfo] of productMap.entries()) {
            await Product.findByIdAndUpdate(productId, { stock_quantity: productInfo.stock });
            updatedStockCount++;
        }
        console.log(`Updated stock for ${updatedStockCount} products.`);


        console.log('---- DATA SEEDING COMPLETE ----');
        res.status(201).json({
            message: 'Sample data seeded successfully with Faker!',
            counts: { users: createdUsers.length, staff: createdStaffIds.length, products: createdProducts.length, orders: createdOrders.length }
        });

    } catch (error) {
        console.error('Error seeding data:', error);
        // Log chi tiết lỗi nếu có thể, vd lỗi duplicate key
        if (error.code === 11000) {
            console.error("Duplicate key error:", error.keyValue);
        }
        res.status(500).json({ message: 'Error seeding data', error: error.message });
    }
}));


// --- Middleware Xử lý lỗi (phải đặt cuối cùng) ---
// Middleware 404 Not Found
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Chuyển lỗi tới errorHandler
};

// Middleware Xử lý lỗi chung
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Mặc định lỗi 500 nếu chưa có status code
    console.error("Error encountered:", err.message);
    res.status(statusCode).json({
        message: err.message,
        // Chỉ hiển thị stack trace trong môi trường development
        stack: process.env.NODE_ENV === 'development' ? err.stack : null,
    });
};

// Áp dụng middleware lỗi
app.use(notFound);
app.use(errorHandler);

// --- Khởi động Server ---
app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`JWT Secret: ${JWT_SECRET === 'your_super_secret_key_for_testing_only' ? '!!! USING DEFAULT TEST SECRET !!!' : 'Custom secret configured'}`);
});
