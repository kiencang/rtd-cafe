# rtd-cafe
Cài đặt nhanh tăng tốc &amp; bảo mật cho Cloudflare. Công cụ đang trong giai đoạn thử nghiệm.

Yêu cầu người dùng:
- Có am hiểu Cloudflare cơ bản
- Site là blog / tin tức WordPress
- Chấp nhận overwrite (ghi đè) lên rule cũ

Khung lý thuyết dựa vào để tạo rule:
- Bảo mật: https://wpsila.com/bao-mat-wp/
- Cache: https://blog.wpsila.com/cache-rules-trong-cloudflare/

Các rule bao gồm:

A. Rule cho bảo mật:
- Chặn truy cập các file nhạy cảm
- Bảo vệ trang đăng nhập & trang admin
- Hạn chế bot rác
- Hạn chế bình luận spam
- Không chặn chính mình
- Giới hạn tần suất đăng nhập trang login

B. Rule cho cache:
- Quy tắc cache chung (cache các trang thành html)
- Cache CSS, JS và font
- Cache ảnh, nhạc, video và file PDF
- Cache ngắn cho sitemap & feed
- Bỏ qua không cache các trang admin, người dùng đã đăng nhập, API, query đặc biệt, page builder
