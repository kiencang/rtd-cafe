# rtd-cafe

**rtd-cafe** là công cụ hỗ trợ **triển khai nhanh các rule cache và bảo mật cho Cloudflare**, được thiết kế **chuyên cho blog / site tin tức WordPress tự quản hạ tầng**.

Công cụ không cài plugin, không chạy nền, và **chỉ cần chạy một lần** để thiết lập các rule chuẩn. Sau khi hoàn tất, người dùng có thể tinh chỉnh thêm trực tiếp trong Cloudflare nếu có nhu cầu riêng.

> ⚠️ Tool này **không dành cho người mới** và **có thể ghi đè (overwrite) các rule Cloudflare hiện có**.

---

## Yêu cầu người dùng

rtd-cafe **chỉ phù hợp** nếu bạn đáp ứng các điều kiện sau:

- Có am hiểu Cloudflare ở mức cơ bản  
- Website là blog / site tin tức WordPress  
- Chấp nhận việc tool ghi đè lên các rule cũ  
- Biết cách tạo và quản lý Cloudflare API Token  

### Quyền API bắt buộc

API Token sử dụng cho rtd-cafe **chỉ cần đúng 3 quyền sau**:

- `Zone.Cache Rules (Edit)` – tạo và quản lý rule cache  
- `Zone.WAF (Edit)` – tạo rule bảo mật  
- `Zone.Transform Rules (Edit)` – xử lý query để tối ưu hiệu suất  

Không yêu cầu quyền dư thừa.

---

## Khung lý thuyết & tài liệu tham khảo

Các rule được xây dựng dựa trên các nguyên tắc đã trình bày tại:

- Bảo mật WordPress với Cloudflare  
  https://wpsila.com/bao-mat-wp/

- Cache Rules cho WordPress trên Cloudflare  
  https://blog.wpsila.com/cache-rules-trong-cloudflare/

---

## Ưu điểm

- Không cần cài thêm plugin WordPress  
- Cấu hình một lần, hiếm khi cần chỉnh sửa lại  
- Logic rõ ràng, có thể tinh chỉnh thủ công trong Cloudflare  
- Phù hợp cho mô hình **“set up đúng từ đầu, dùng lâu dài”**

---

## Các rule được triển khai

### A. Rule bảo mật

- Chặn truy cập các file nhạy cảm  
- Bảo vệ trang đăng nhập và khu vực admin  
- Hạn chế bot rác và comment spam  
- Giới hạn tần suất đăng nhập  
- Tránh tự chặn chính quản trị viên  

### B. Rule cache

- Cache trang HTML cho người dùng chưa đăng nhập  
- Cache CSS, JS, font  
- Cache ảnh, media, file PDF  
- Cache ngắn cho sitemap và feed  
- Bỏ qua cache với admin, user login, API, page builder và các query đặc biệt  

---

Lưu ý: Quý vị vui lòng đọc kỹ tuyên bố từ chối trách nhiệm trước khi dùng (DISCLAIMERS.md).
Link: https://github.com/kiencang/rtd-cafe/blob/main/DISCLAIMERS.md
