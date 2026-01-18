# ⚡ rtd-cafe: WP Cloudflare Optimizer

**rtd-cafe** là công cụ tự động hóa việc cấu hình **Cache Rules** và **WAF (Bảo mật)** trên Cloudflare, được tối ưu hóa đặc biệt cho **WordPress Blog & Trang tin tức** sử dụng VPS.

> 💡 **Triết lý:** Đơn giản, Không chạy nền, "Set and Forget" (Cấu hình một lần dùng lâu dài).

rtd-cafe kết hợp rất ổn thỏa với plugin [Cache Enabler](https://blog.wpsila.com/plugin-cache-enabler/) để cải thiện hiệu suất hơn nữa. Cache Enabler lo phần cache phía server, còn rtd-cafe cài đặt cache cho bạn ở phía Cloudflare. Có hai lớp đệm cache này trang web của bạn có khả năng chịu được lưu lượng truy cập cao hơn rất nhiều.

---

## ⚠️ Cảnh báo quan trọng

Tool này **KHÔNG** dành cho người mới bắt đầu (Newbie).

1.  **Ghi đè cấu hình:** Tool sẽ **XÓA VÀ THAY THẾ** các Cache Rules, WAF Custom Rules và Rate Limiting Rules hiện có trong Zone của bạn.
2.  **Phạm vi:** Chỉ tối ưu cho Blog/Tin tức. **Không dùng** cho WooCommerce, Membership Site hoặc LMS (web học trực tuyến).

---

## 🚀 Cách sử dụng

### Cách 1: Sử dụng công cụ Online (Khuyên dùng)
Truy cập giao diện web để cấu hình nhanh mà không cần động vào code:
👉 **[Link Tool: rtd-cafe.wpsila.com](https://rtd-cafe.wpsila.com)**

Bạn chỉ cần biết cách tạo API token trên Cloudflare là sử dụng được tool này để tăng tốc & bảo mật cho blog WordPress.

### Cách 2: Tự triển khai
Cách này phức tạp hơn vì bạn phải tự triển khai công cụ.

**Lý do chính**: Nếu bạn muốn tự chạy mã trên tài khoản Cloudflare của riêng bạn để đảm bảo quyền riêng tư tuyệt đối (để không phải gửi API token qua giao diện web của tôi):

1. Tải bản này về: https://github.com/kiencang/rtd-cafe/archive/refs/tags/v1.0.10.zip (lý do là vì các phiên bản sau có cập nhật bảo mật chặt hơn với Turnstile nên sẽ khó điều chỉnh hơn khá nhiều).
2. Chỉnh sửa thêm mã nếu cần (ví dụ thêm bớt rule, điều chỉnh rule).
3. Dùng `index.html` (và các thành phần đi kèm là `style.css`, `script.js`, `favicon`) làm giao diện cài đặt (giao diện nơi người dùng nhập form).
4. Dùng `worker.js` làm phần đưa cài đặt các rule vào Cloudflare.
5. Upload lên Cloudflare Worker, lấy các đường link tương ứng của nó cho index.html và worker.js
6. Trong `worker.js` tìm đến phần `const ALLOWED_ORIGIN = "https://rtd-cafe.wpsila.com";` thay thế `https://rtd-cafe.wpsila.com` bằng link index.html thực tế của bạn, save lưu file.
7. Trong `index.html` tìm đến phần `const WORKER_URL = "https://rtd-cafe-settings.wpsila.com/rtd-cafe-worker-api";` thay thế địa chỉ chính `https://rtd-cafe-settings.wpsila.com` bằng link worker.js thực tế của bạn. Lưu ý vẫn phải giữ lại đuôi `/rtd-cafe-worker-api`, ví dụ `https://wkjs.cua-ban.workers.dev/rtd-cafe-worker-api`
8. Vẫn trong `index.html`, xóa dòng `<link rel="canonical" href="https://rtd-cafe.wpsila.com">`, lưu file để hoàn tất.
9. Upload lại `index.html` & edit code `worker.js` thay thế nó bằng mã đã điều chỉnh để nó cập nhật các đường link mới của riêng bạn.
10. Bắt đầu sử dụng.

**PS**: Với bạn nào có khả năng tìm hiểu sâu hơn nên tải bản mới nhất về, nó sử dụng thêm Turnstile để chống worker bị lạm dụng. Các bản mới nhất sử dụng biến môi trường cho Turnstile & ALLOWED_ORIGIN.

---

## ✅ Yêu cầu đầu vào

Để sử dụng tool, bạn cần chuẩn bị:
- **Kiến thức:** Hiểu cơ bản về Cloudflare Proxy (đám mây cam) và DNS.
- **Hạ tầng:** Website WordPress chạy trên VPS/Server riêng.
- **API Token:** Tạo token tại Cloudflare Dashboard với đúng **3 quyền** sau:
  - `Zone`.`Cache Rules`: **Edit**
  - `Zone`.`WAF`: **Edit**
  - `Zone`.`Transform Rules`: **Edit**

---

## 🛠️ Các tính năng kỹ thuật

Tool sẽ tự động thiết lập các quy tắc sau dựa trên [lý thuyết tối ưu của wpsila](https://blog.wpsila.com/cache-rules-trong-cloudflare/):

### A. Bảo mật (WAF & Security)
- 🛡️ **Whitelist Server IP:** Ngăn chặn việc tự chặn chính mình (Self-blocking).
- 🔒 **Sensitive Files:** Chặn truy cập trực tiếp vào `.log`, `.sql`, `.env`, `.git`...
- 🤖 **Anti-Bot:** Thách thức (Challenge) các bot rác, user-agent đáng ngờ.
- 🚪 **Login Protection:** Giới hạn Rate Limit cho `wp-login.php` để chống Brute Force.

### B. Tăng tốc (Cache Rules)
- ⚡ **Cache Everything:** Cache HTML cho trang chủ, chuyên mục, bài viết (cho khách).
- 🎨 **Static Cache:** Cache dài hạn cho CSS, JS, Fonts, Images.
- 🔄 **Bypass thông minh:** Tự động bỏ qua Cache khi phát hiện:
  - Admin đăng nhập (`wordpress_logged_in_*`)
  - WP-Cron, XMLRPC, WP-JSON API
  - Và một số logic khác

### C. Tối ưu (Transform Rules)
- 🧹 **Query String Cleaning:** Tự động loại bỏ các query rác (`fbclid`, `utm_source`, `gclid`...) để tăng tỷ lệ HIT cache.

---

## 📚 Tài liệu tham khảo
Các rule này được xây dựng dựa trên kinh nghiệm vận hành thực tế và các bài viết sau:
*   [Bảo mật WordPress với Cloudflare](https://wpsila.com/bao-mat-wp/)
*   [Cache Rules cho WordPress trên Cloudflare](https://blog.wpsila.com/cache-rules-trong-cloudflare/)

---

## ⚖️ Tuyên bố từ chối trách nhiệm (Disclaimer)
Công cụ được cung cấp "nguyên trạng" (as-is). Tác giả không chịu trách nhiệm cho bất kỳ thiệt hại nào về dữ liệu hoặc gián đoạn dịch vụ khi sử dụng công cụ này. Vui lòng xem chi tiết tại [DISCLAIMERS.md](DISCLAIMERS.md).
