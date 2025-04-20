// controllers/productController.js
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Fetch all products with pagination and search
// @route   GET /api/products
// @access  Private (Admin/Staff)
const getProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Mặc định 10 sp/trang
    const skip = (page - 1) * limit;
    const { searchTerm, sortBy, sortOrder } = req.query; // Lấy tham số từ query

    // Xây dựng query filter
    const query = {};
    if (searchTerm) {
        // Tìm kiếm không phân biệt hoa thường trong Tên hoặc SKU
        query.$or = [
            { name: { $regex: searchTerm, $options: 'i' } },
            { sku: { $regex: searchTerm, $options: 'i' } }
        ];
    }

    // Xây dựng options sắp xếp
    const sortOptions = {};
    if (sortBy) {
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
        sortOptions.createdAt = -1; // Mặc định sắp xếp theo ngày tạo mới nhất
    }

    try {
        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort(sortOptions)
            .limit(limit)
            .skip(skip)
        // .populate('createdBy', 'username'); // Populate nếu cần

        res.json({
            products: products, // Trả về danh sách sản phẩm
            page: page, // Trang hiện tại
            pages: Math.ceil(totalProducts / limit), // Tổng số trang
            total: totalProducts // Tổng số sản phẩm khớp filter
        });
    } catch (error) {
        res.status(500);
        throw new Error('Lỗi khi truy vấn sản phẩm');
    }
});

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Private (Admin/Staff)
const getProductById = asyncHandler(async (req, res) => {
    // Validate ID nếu cần
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('ID sản phẩm không hợp lệ');
    }

    const product = await Product.findById(req.params.id);
    if (product) {
        res.json(product);
    } else {
        res.status(404); throw new Error('Không tìm thấy sản phẩm');
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin/Staff) - Ai được tạo? Thường là Admin
const createProduct = asyncHandler(async (req, res) => {
    const { name, price, description, image_url, stock_quantity, sku } = req.body;

    // Validation chặt chẽ hơn
    if (!name || name.trim() === '') { res.status(400); throw new Error('Tên sản phẩm là bắt buộc'); }
    if (price === undefined || price === '' || isNaN(Number(price)) || Number(price) < 0) { res.status(400); throw new Error('Giá phải là số không âm'); }
    if (stock_quantity === undefined || stock_quantity === '' || !Number.isInteger(Number(stock_quantity)) || Number(stock_quantity) < 0) { res.status(400); throw new Error('SL tồn kho phải là số nguyên không âm'); }

    // Kiểm tra SKU trùng (nếu có)
    if (sku) {
        const skuExists = await Product.findOne({ sku: sku });
        if (skuExists) { res.status(400); throw new Error('Mã SKU này đã tồn tại'); }
    }

    // Tạo sản phẩm mới
    const product = new Product({
        name, price: Number(price), description, image_url,
        stock_quantity: Number(stock_quantity), sku,
        // createdBy: req.staff._id // Lưu ID người tạo (tùy chọn)
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct); // Trả về sản phẩm đã tạo
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin/Staff) - Thường là Admin
const updateProduct = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('ID sản phẩm không hợp lệ');
    }
    const { name, price, description, image_url, stock_quantity, sku } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) { res.status(404); throw new Error('Không tìm thấy sản phẩm'); }

    // Cập nhật các trường nếu có giá trị mới được cung cấp
    if (name !== undefined) product.name = name;
    if (price !== undefined) {
        if (isNaN(Number(price)) || Number(price) < 0) throw new Error('Giá không hợp lệ');
        product.price = Number(price);
    }
    if (description !== undefined) product.description = description;
    if (image_url !== undefined) product.image_url = image_url;
    if (stock_quantity !== undefined) {
        if (!Number.isInteger(Number(stock_quantity)) || Number(stock_quantity) < 0) throw new Error('SL tồn kho không hợp lệ');
        product.stock_quantity = Number(stock_quantity);
    }

    // Xử lý SKU: kiểm tra trùng nếu thay đổi hoặc thêm mới SKU
    if (sku !== undefined) {
        if (sku === "") { // Cho phép xóa SKU
            product.sku = undefined;
        } else if (sku !== product.sku) {
            const skuExists = await Product.findOne({ sku: sku, _id: { $ne: product._id } });
            if (skuExists) { throw new Error('Mã SKU này đã được sản phẩm khác sử dụng'); }
            product.sku = sku;
        }
    }

    // product.updatedBy = req.staff._id; // Lưu người cập nhật

    const updatedProduct = await product.save();
    res.json(updatedProduct); // Trả về sản phẩm đã cập nhật
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
const deleteProduct = asyncHandler(async (req, res) => {
    const productId = req.params.id; // Lấy ID sản phẩm từ URL

    // 1. Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400);
        throw new Error('ID sản phẩm không hợp lệ');
    }

    // --- THÊM BƯỚC KIỂM TRA TRONG ĐƠN HÀNG ---
    // 2. Kiểm tra xem sản phẩm có tồn tại trong bất kỳ order_items nào không
    const orderContainingProduct = await Order.findOne({ 'order_items.product_id': productId });
    // 'order_items.product_id': productId -> cú pháp query trong mảng subdocument

    // 3. Nếu tìm thấy đơn hàng chứa sản phẩm này -> KHÔNG CHO XÓA
    if (orderContainingProduct) {
        res.status(400); // Bad Request vì vi phạm quy tắc nghiệp vụ
        throw new Error('Không thể xóa sản phẩm này vì nó đã tồn tại trong ít nhất một đơn hàng đã được đặt. Hãy cân nhắc việc đặt trạng thái "ngừng kinh doanh" thay vì xóa.');
    }
    // --- KẾT THÚC BƯỚC KIỂM TRA ---

    // 4. Nếu không có trong đơn hàng nào, tiến hành tìm sản phẩm để xóa
    const product = await Product.findById(productId);

    // 5. Kiểm tra xem sản phẩm có thực sự tồn tại không
    if (!product) {
        res.status(404);
        throw new Error('Không tìm thấy sản phẩm');
    }

    // 6. Thực hiện xóa sản phẩm (nếu tất cả kiểm tra đều qua)
    await product.deleteOne(); // Sử dụng deleteOne()

    // 7. Trả về thông báo thành công
    res.json({ message: 'Sản phẩm đã được xóa thành công (vì không tìm thấy trong đơn hàng nào).' });
});

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
