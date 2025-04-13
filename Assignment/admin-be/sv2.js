const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const port = 5000;

const SECRET_KEY = 'your-secret-key';

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://root:example@localhost:27017/shopee?authSource=admin', {
    serverSelectionTimeoutMS: 30000
}).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Schemas
const categorySchema = new mongoose.Schema({
    _id: Number,
    name: String
});

const roleSchema = new mongoose.Schema({
    _id: Number,
    name: String
});

const userSchema = new mongoose.Schema({
    _id: Number,
    fullname: String,
    email: String,
    phone_number: String,
    password: String,
    address: String,
    role_id: { type: Number, ref: 'Role' }
});

const productSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    status: Number,
    price: Number,
    picture: String,
    description: String,
    category_id: { type: Number, ref: 'Category' }
});

const orderSchema = new mongoose.Schema({
    _id: Number,
    user_id: { type: Number, ref: 'User' },
    message: String,
    order_date: { type: Date, default: Date.now },
    status: String,
    total_money: Number,
    online_payment: Number
});

const orderDetailSchema = new mongoose.Schema({
    _id: Number,
    order_id: { type: Number, ref: 'Order' },
    product_id: { type: Number, ref: 'Product' },
    price: Number,
    number_of_products: Number,
    total_money: Number
});

// Models
const Category = mongoose.model('Category', categorySchema);
const Role = mongoose.model('Role', roleSchema);
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const OrderDetail = mongoose.model('OrderDetail', orderDetailSchema);

// Khởi tạo dữ liệu ban đầu
const initializeData = async () => {
    try {
        // Roles
        await Role.deleteMany({});
        await Role.insertMany([
            { _id: 1, name: 'Admin' },
            { _id: 2, name: 'User' },
            { _id: 3, name: 'Nhân viên' }
        ]);

        // Users
        await User.deleteMany({});
        await User.insertMany([
            { _id: 1, fullname: 'Admin User', email: 'admin@example.com', phone_number: '1234567890', password: await bcrypt.hash('admin123', 10), address: '123 Admin St', role_id: 1 },
            { _id: 2, fullname: 'Staff User', email: 'staff@example.com', phone_number: '0987654321', password: await bcrypt.hash('staff123', 10), address: '456 Staff Rd', role_id: 3 },
            { _id: 3, fullname: 'John Doe', email: 'john@example.com', phone_number: '1112223333', password: await bcrypt.hash('john123', 10), address: '789 User Ave', role_id: 2 },
            { _id: 4, fullname: 'Jane Smith', email: 'jane@example.com', phone_number: '4445556666', password: await bcrypt.hash('jane123', 10), address: '101 User Blvd', role_id: 2 },
            { _id: 5, fullname: 'Staff Two', email: 'staff2@example.com', phone_number: '7778889999', password: await bcrypt.hash('staff123', 10), address: '202 Staff Ln', role_id: 3 }
        ]);

        // Categories
        await Category.deleteMany({});
        await Category.insertMany([
            { _id: 1, name: 'Đồ điện tử' },
            { _id: 2, name: 'Thời trang' },
            { _id: 3, name: 'Gia dụng' },
            { _id: 4, name: 'Sách' },
            { _id: 5, name: 'Thể thao' }
        ]);

        // Products
        await Product.deleteMany({});
        await Product.insertMany([
            { _id: 1, name: 'iPhone 13', status: 1, price: 20000000, picture: 'iphone13.jpg', description: 'Điện thoại thông minh', category_id: 1 },
            { _id: 2, name: 'Áo thun nam', status: 1, price: 150000, picture: 'aothun.jpg', description: 'Áo thun cotton', category_id: 2 },
            { _id: 3, name: 'Máy giặt LG', status: 1, price: 8000000, picture: 'maygiat.jpg', description: 'Máy giặt 8kg', category_id: 3 },
            { _id: 4, name: 'Sách Harry Potter', status: 1, price: 200000, picture: 'harrypotter.jpg', description: 'Tiểu thuyết giả tưởng', category_id: 4 },
            { _id: 5, name: 'Giày chạy bộ Nike', status: 1, price: 1200000, picture: 'giaynike.jpg', description: 'Giày thể thao cao cấp', category_id: 5 },
            { _id: 6, name: 'Samsung Galaxy S23', status: 1, price: 25000000, picture: 's23.jpg', description: 'Điện thoại cao cấp', category_id: 1 },
            { _id: 7, name: 'Quần jeans nữ', status: 1, price: 300000, picture: 'jeans.jpg', description: 'Quần jeans thời trang', category_id: 2 },
            { _id: 8, name: 'Nồi cơm điện', status: 1, price: 500000, picture: 'noicom.jpg', description: 'Nồi cơm 1.8L', category_id: 3 },
            { _id: 9, name: 'Sách Lập trình JS', status: 1, price: 250000, picture: 'jsbook.jpg', description: 'Sách học lập trình', category_id: 4 },
            { _id: 10, name: 'Bóng rổ Spalding', status: 1, price: 400000, picture: 'bongro.jpg', description: 'Bóng rổ chuyên nghiệp', category_id: 5 }
        ]);

        // Orders
        await Order.deleteMany({});
        await Order.insertMany([
            { _id: 1, user_id: 3, message: 'Giao trong ngày', order_date: new Date('2025-04-01'), status: 'Pending', total_money: 20200000, online_payment: 1 },
            { _id: 2, user_id: 4, message: 'Giao nhanh', order_date: new Date('2025-04-02'), status: 'Shipped', total_money: 450000, online_payment: 0 },
            { _id: 3, user_id: 3, message: 'Gói cẩn thận', order_date: new Date('2025-04-03'), status: 'Delivered', total_money: 8400000, online_payment: 1 },
            { _id: 4, user_id: 4, message: 'Giao chiều', order_date: new Date('2025-04-04'), status: 'Pending', total_money: 25200000, online_payment: 1 }
        ]);

        // Order Details
        await OrderDetail.deleteMany({});
        await OrderDetail.insertMany([
            { _id: 1, order_id: 1, product_id: 1, price: 20000000, number_of_products: 1, total_money: 20000000 },
            { _id: 2, order_id: 1, product_id: 2, price: 150000, number_of_products: 1, total_money: 150000 },
            { _id: 3, order_id: 2, product_id: 2, price: 150000, number_of_products: 2, total_money: 300000 },
            { _id: 4, order_id: 2, product_id: 8, price: 500000, number_of_products: 1, total_money: 500000 },
            { _id: 5, order_id: 3, product_id: 3, price: 8000000, number_of_products: 1, total_money: 8000000 },
            { _id: 6, order_id: 3, product_id: 10, price: 400000, number_of_products: 1, total_money: 400000 },
            { _id: 7, order_id: 4, product_id: 6, price: 25000000, number_of_products: 1, total_money: 25000000 },
            { _id: 8, order_id: 4, product_id: 7, price: 300000, number_of_products: 1, total_money: 300000 }
        ]);

        console.log('Initial data created successfully');
    } catch (error) {
        console.error('Error initializing data:', error);
    }
};

// Middleware xác thực
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Middleware kiểm tra quyền
const requireAdmin = (req, res, next) => {
    if (req.user.role_id !== 1) return res.status(403).json({ message: 'Admin only' });
    next();
};

const requireAdminOrStaff = (req, res, next) => {
    if (![1, 3].includes(req.user.role_id)) return res.status(403).json({ message: 'Admin or Staff only' });
    next();
};

// Authentication Routes
app.post('/api/register', authenticateToken, requireAdmin, async (req, res) => {
    const { fullname, email, phone_number, password, address, role_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
        _id: Date.now(),
        fullname,
        email,
        phone_number,
        password: hashedPassword,
        address,
        role_id: role_id || 2
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully', user });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role_id: user.role_id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, role_id: user.role_id, fullname: user.fullname } });
});

// CRUD Routes
app.get('/api/categories', async (req, res) => {
    const categories = await Category.find();
    res.json(categories);
});

app.get('/api/categories/:id', async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
});

app.post('/api/categories', authenticateToken, requireAdmin, async (req, res) => {
    const category = new Category({ _id: Date.now(), ...req.body });
    await category.save();
    res.status(201).json(category);
});

app.put('/api/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
});

app.delete('/api/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
});

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    const users = await User.find().populate('role_id');
    res.json(users);
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
    const user = await User.findById(req.params.id).populate('role_id');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.user.role_id !== 1 && req.user.id !== user._id) {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    res.json(user);
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.user.role_id !== 1 && req.user.id !== user._id) {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    const updateData = { ...req.body };
    if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    if (req.user.role_id !== 1) delete updateData.role_id;
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedUser);
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
});

app.get('/api/products', async (req, res) => {
    const products = await Product.find().populate('category_id');
    res.json(products);
});

app.get('/api/products/:id', async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category_id');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
});

app.post('/api/products', authenticateToken, requireAdminOrStaff, async (req, res) => {
    const product = new Product({ _id: Date.now(), ...req.body });
    await product.save();
    res.status(201).json(product);
});

app.put('/api/products/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
});

app.delete('/api/products/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
});

app.get('/api/orders', authenticateToken, async (req, res) => {
    const query = req.user.role_id === 2 ? { user_id: req.user.id } : {};
    const orders = await Order.find(query).populate('user_id');
    res.json(orders);
});

app.get('/api/orders/:id', authenticateToken, async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user_id');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role_id === 2 && order.user_id._id !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    res.json(order);
});

app.post('/api/orders', authenticateToken, async (req, res) => {
    const order = new Order({ _id: Date.now(), user_id: req.user.id, ...req.body });
    await order.save();
    res.status(201).json(order);
});

app.put('/api/orders/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
});

app.delete('/api/orders/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
});

app.get('/api/order-details', authenticateToken, async (req, res) => {
    const orderDetails = await OrderDetail.find()
        .populate('order_id')
        .populate('product_id');
    res.json(orderDetails);
});

app.get('/api/order-details/:id', authenticateToken, async (req, res) => {
    const orderDetail = await OrderDetail.findById(req.params.id)
        .populate('order_id')
        .populate('product_id');
    if (!orderDetail) return res.status(404).json({ message: 'Order detail not found' });
    res.json(orderDetail);
});

app.post('/api/order-details', authenticateToken, requireAdminOrStaff, async (req, res) => {
    const orderDetail = new OrderDetail({ _id: Date.now(), ...req.body });
    await orderDetail.save();
    res.status(201).json(orderDetail);
});

app.put('/api/order-details/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
    const orderDetail = await OrderDetail.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!orderDetail) return res.status(404).json({ message: 'Order detail not found' });
    res.json(orderDetail);
});

app.delete('/api/order-details/:id', authenticateToken, requireAdminOrStaff, async (req, res) => {
    const orderDetail = await OrderDetail.findByIdAndDelete(req.params.id);
    if (!orderDetail) return res.status(404).json({ message: 'Order detail not found' });
    res.json({ message: 'Order detail deleted' });
});

// Khởi động server
app.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`);
    await initializeData();
});
