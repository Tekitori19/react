// src/utils/helpers.js

/**
 * Trả về ngày bắt đầu và kết thúc cho một khoảng thời gian nhất định.
 * @param {'week' | 'month' | 'year' | 'current_month' | string} period Khoảng thời gian.
 * @returns {{start: Date, end: Date}} Object chứa ngày bắt đầu và kết thúc.
 */
const getDateRange = (period) => {
    const end = new Date();
    let start = new Date();

    switch (period?.toLowerCase()) {
        case 'week': // 7 ngày gần nhất (tính cả hôm nay)
            start.setDate(end.getDate() - 7 + 1);
            break;
        case 'month': // 30 ngày gần nhất (tính cả hôm nay)
            start.setDate(end.getDate() - 30 + 1);
            break;
        case 'year': // 365 ngày gần nhất (tính cả hôm nay)
            start.setDate(end.getDate() - 365 + 1);
            // Hoặc setFullYear(end.getFullYear() - 1) nếu muốn đúng 1 năm trước
            // start.setFullYear(end.getFullYear() - 1); start.setDate(start.getDate() + 1);
            break;
        case 'current_month': // Từ đầu tháng đến hiện tại
            start = new Date(end.getFullYear(), end.getMonth(), 1);
            break;
        // Add more cases like 'last_week', 'last_month' if needed
        // case 'last_month':
        //    start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
        //    end = new Date(end.getFullYear(), end.getMonth(), 0); // Ngày cuối của tháng trước
        //    break;
        default: // Mặc định lấy 30 ngày gần nhất
            start.setDate(end.getDate() - 30 + 1);
            break;
    }

    start.setHours(0, 0, 0, 0); // Bắt đầu từ 00:00:00 của ngày bắt đầu
    end.setHours(23, 59, 59, 999); // Kết thúc vào 23:59:59 của ngày kết thúc

    return { start, end };
};

module.exports = { // Export theo kiểu CommonJS để dễ require trong các controller BE
    getDateRange,
};
