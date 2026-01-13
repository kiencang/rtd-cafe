# rtd-cafe
Cài đặt nhanh tăng tốc &amp; bảo mật cho Cloudflare. Công cụ đang trong giai đoạn phát triển thêm, test chức năng đã hoạt động ổn.

### Yêu cầu người dùng
- Có am hiểu Cloudflare cơ bản
- Site là blog / tin tức WordPress
- Chấp nhận overwrite (ghi đè) lên rule cũ
- Biết cách tạo API token để công cụ sử dụng chi việc tạo rule trên Cloudflare

### Các quyền cho API token bắt buộc phải có
Chỉ cần 3 quyền sau:
- Zone.Cache Rules (Edit): để tạo các rule liên quan đến cache
- Zone.WAF (Edit): để tạo các rule bảo mật
- Zone.Transform Rules (Edit): để tạo rule liên quan đến việc bỏ qua các query cho nhiệm vụ đảm bảo hiệu suất cao

### Khung lý thuyết dựa vào để tạo rule
- Bảo mật: https://wpsila.com/bao-mat-wp/
- Cache: https://blog.wpsila.com/cache-rules-trong-cloudflare/

### Ưu điểm
- Không phải cài thêm plugin
- Cài xong một lần là xong, hiếm khi phải điều chỉnh lại
- Có thể tinh chỉnh thêm thủ công trong chính Cloudflare nếu có nhu cầu riêng

## Các rule bao gồm

### A. Rule cho bảo mật
- Chặn truy cập các file nhạy cảm
- Bảo vệ trang đăng nhập & trang admin
- Hạn chế bot rác
- Hạn chế bình luận spam
- Không chặn chính mình
- Giới hạn tần suất đăng nhập trang login

### B. Rule cho cache
- Quy tắc cache chung (cache các trang thành html)
- Cache CSS, JS và font
- Cache ảnh, nhạc, video và file PDF
- Cache ngắn cho sitemap & feed
- Bỏ qua không cache các trang admin, người dùng đã đăng nhập, API, query đặc biệt, page builder
