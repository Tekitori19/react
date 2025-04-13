// src/utils/helpers.js

/**
 * Trả về ngày bắt đầu và kết thúc cho một khoảng thời gian nhất định.
 * @param {'week' | 'month' | 'year' | string} period Khoảng thời gian ('week', 'month', 'year', hoặc mặc định là tháng hiện tại).
 * @returns {{start: Date, end: Date}} Object chứa ngày bắt đầu và kết thúc.
 */
const getDateRange = (period) => {
    const end = new Date(); // Ngày hiện tại
    let start = new Date(); // Bắt đầu cũng từ ngày hiện tại

    switch (period?.toLowerCase()) { // Chuyển về chữ thường để linh hoạt hơn
        case 'week':
             start.setDate(end.getDate() - 7 + 1); // 7 ngày trước (tính cả ngày hiện tại là 7 ngày)
            break;
        case 'month':
            start.setMonth(end.getMonth() - 1); // 1 tháng trước
            start.setDate(start.getDate() + 1); // Bắt đầu từ ngày kế tiếp của tháng trước
            break;
        case 'year':
            start.setFullYear(end.getFullYear() - 1); // 1 năm trước
            start.setDate(start.getDate() + 1);
            break;
         case 'current_month': // Thêm tùy chọn lấy tháng hiện tại
             start = new Date(end.getFullYear(), end.getMonth(), 1);
             break;
         // Thêm các khoảng khác nếu cần: 'last_7_days', 'last_30_days', 'year_to_date'
        default:
             // Mặc định: Lấy 30 ngày gần nhất (bao gồm hôm nay)
            start.setDate(end.getDate() - 30 + 1);
            break;
     }

     // Đặt giờ về đầu ngày cho start và cuối ngày cho end
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

module.exports = { // Export theo kiểu CommonJS để dễ require trong các controller BE
    getDateRange,
 };
