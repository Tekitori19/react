// src/utils/formatters.js

/**
 * Định dạng một số thành chuỗi tiền tệ VND.
 * @param {number | null | undefined} amount Số tiền cần định dạng.
 * @returns {string} Chuỗi tiền tệ đã định dạng hoặc '-' nếu input không hợp lệ.
 */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
        return '-'; // Trả về gạch ngang nếu không phải số hợp lệ
    }
    try {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
    } catch (error) {
        console.error("Error formatting currency:", error);
        return '-'; // Trả về gạch ngang nếu có lỗi
    }
};

/**
 * Định dạng chuỗi ngày hoặc đối tượng Date thành chuỗi ngày dd/MM/yyyy.
 * @param {string | Date | null | undefined} dateString Ngày cần định dạng.
 * @param {object} options Tùy chọn bổ sung cho Intl.DateTimeFormat.
 * @returns {string} Chuỗi ngày đã định dạng hoặc '-' nếu input không hợp lệ.
 */
export const formatDate = (dateString, options = {}) => {
    if (!dateString) return '-';
    try {
        const defaultOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            ...options, // Cho phép ghi đè hoặc thêm tùy chọn (vd: giờ, phút)
        };
        return new Intl.DateTimeFormat('vi-VN', defaultOptions).format(new Date(dateString));
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'Invalid Date'; // Hoặc trả về '-'
    }
};
