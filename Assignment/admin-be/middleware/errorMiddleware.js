// middleware/errorMiddleware.js

// Middleware xử lý lỗi 404 Not Found
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.method} ${req.originalUrl}`);
    res.status(404);
    next(error); // Chuyển lỗi đến errorHandler tiếp theo
};

// Middleware xử lý lỗi chung (phải có 4 tham số: err, req, res, next)
const errorHandler = (err, req, res, next) => {
    // Xác định status code: Nếu response đã có statusCode (vd: lỗi 400 từ validation) thì giữ nguyên, nếu không thì mặc định 500
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    // Log lỗi ra console (cho developer)
    console.error('--------------------');
    console.error(`[${new Date().toISOString()}] ${statusCode} - ${err.message}`);
    // Log stack trace chỉ khi ở môi trường dev để debug
    if (process.env.NODE_ENV !== 'production') {
         console.error(err.stack);
    }
     console.error('--------------------');


    // Gửi phản hồi lỗi về client
    res.json({
        message: err.message, // Thông báo lỗi cho client
        // Chỉ gửi stack trace về client khi ở môi trường development
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};

module.exports = { notFound, errorHandler };
