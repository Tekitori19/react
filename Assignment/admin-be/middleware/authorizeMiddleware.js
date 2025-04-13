// middleware/authorizeMiddleware.js

const authorize = (...allowedRoles) => { // Nhận danh sách các role được phép
    return (req, res, next) => {
        // Middleware này nên chạy SAU middleware 'protect'
        if (!req.staff || !req.staff.role) {
            // Lỗi này không nên xảy ra nếu protect chạy đúng, nhưng kiểm tra cho chắc
            res.status(401);
            return next(new Error('Not authorized, user role not found')); // Dùng next(error)
        }

        // Kiểm tra xem role của user có nằm trong danh sách được phép không
        if (!allowedRoles.includes(req.staff.role)) {
            res.status(403); // Forbidden - Không có quyền truy cập
            return next(new Error(`Forbidden: Role '${req.staff.role}' is not authorized for this resource`));
        }

        next(); // User có quyền, cho phép tiếp tục
    };
};

module.exports = { authorize };
