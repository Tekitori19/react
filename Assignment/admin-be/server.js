// server.js (File khởi động chính)
require('dotenv').config(); // Load biến môi trường ĐẦU TIÊN
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Import hàm kết nối DB
const { notFound, errorHandler } = require('./middleware/errorMiddleware'); // Import error handlers
const { seedDatabase } = require('./controllers/dashboardController'); // Import hàm seed database

// Import tất cả các routes đã tách
const authRoutes = require('./routes/authRoutes');
const staffRoutes = require('./routes/staffRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes'); // Routes cho dashboard stats & seed

// --- Khởi tạo App và Kết nối DB ---
const app = express();
connectDB(); // Gọi hàm kết nối DB

// --- Middleware cơ bản ---
app.use(cors()); // Cho phép CORS (cấu hình chi tiết nếu cần)
app.use(express.json()); // Parse JSON request body

// --- Mount Routers ---
// Gắn các router vào đường dẫn API tương ứng
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes); // Gắn dashboard routes
app.post('/api/seed', seedDatabase); // Chỉ admin được chạy seed

// --- Route Test Cơ bản ---
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Shop Dashboard API!' });
});

// --- Middleware Xử lý lỗi (PHẢI ĐẶT SAU CÙNG) ---
app.use(notFound); // Bắt lỗi 404
app.use(errorHandler); // Bắt lỗi chung

// --- Khởi động Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);
