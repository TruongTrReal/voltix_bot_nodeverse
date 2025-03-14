
# Voltix Bot Nodeverse

## Hướng dẫn cài đặt và sử dụng

### 1. Yêu cầu hệ thống
- Node.js (Phiên bản mới nhất)
- Git

### 2. Cài đặt Node.js
- Truy cập [nodejs.org](https://nodejs.org)
- Tải và cài đặt phiên bản LTS mới nhất
- Kiểm tra cài đặt bằng lệnh:
```bash
node --version
npm --version
```

### 3. Cài đặt dự án
1. Clone repository:
```bash
git clone https://github.com/TruongTrReal/voltix_bot_nodeverse
cd voltix_bot_nodeverse
```

2. Cài đặt các dependencies:
```bash
npm install
```

### 4. Cấu hình
1. Thêm Phantom keys vào file `phantomKeys.txt`:
- Mỗi key trên một dòng
- Định dạng: recovery phrase của ví Phantom

2. Thêm proxy vào file `proxy.txt`:
- Mỗi proxy trên một dòng
- Định dạng: ip:port hoặc username:password@ip:port
- Lưu ý: Mỗi key sẽ sử dụng 5 proxy, vì vậy số lượng proxy cần >= số key × 5

### 5. Chạy chương trình
- Chạy bình thường:
```bash
node run.js
```

- Chạy ở chế độ headless (không hiển thị giao diện):
```bash
node run.js --headless
```

### Lưu ý
- Mỗi key Phantom sẽ chạy automation trên 5 proxy khác nhau
- Đảm bảo số lượng proxy đủ cho số key (số proxy >= số key × 5)
- Chương trình sẽ tự động kiểm tra điểm mỗi 10 phút
- Các profile trình duyệt sẽ được lưu trong thư mục `profiles`

### Hỗ trợ
Nếu gặp vấn đề, vui lòng tạo issue trên GitHub repository.
```
