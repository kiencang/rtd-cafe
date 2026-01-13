# DISCLAIMERS

Tài liệu này nhằm **làm rõ phạm vi sử dụng và giới hạn của rtd-cafe**.  
Nếu bạn không đồng ý với các điều dưới đây, **đừng sử dụng công cụ này**.

---

## 1. rtd-cafe KHÔNG dành cho mọi người

rtd-cafe **không phải** là công cụ:

- Dành cho người mới làm quen với Cloudflare  
- Dành cho người không hiểu Cache Rules, WAF, Rate Limit  
- Dành cho ai muốn “bấm đại cho xong rồi sửa sau”  

Công cụ này giả định rằng người dùng:
- Hiểu mình đang làm gì  
- Hiểu hậu quả của việc overwrite rule  
- Có khả năng tự rollback hoặc chỉnh sửa thủ công nếu cần  

---

## 2. Tool sẽ GHI ĐÈ rule Cloudflare hiện có

rtd-cafe **xóa và thay thế** các Cache Rules, WAF Rules, Transform Rules hiện có trên Zone được áp dụng.

- Không merge
- Không giữ lại rule cũ
- Không backup tự động

👉 Nếu bạn đang có cấu hình Cloudflare phức tạp hoặc tùy biến sâu, **hãy cân nhắc kỹ** trước khi dùng.

---

## 3. Không phù hợp cho mọi loại website

rtd-cafe **chỉ được thiết kế cho**:

- Blog WordPress
- Website tin tức
- Nội dung chủ yếu là đọc (read-heavy)

rtd-cafe **không phù hợp** cho:

- WooCommerce
- Membership / LMS
- Website có logic cá nhân hóa cao
- Website phụ thuộc mạnh vào cookie / session

---

## 4. Không thay thế kiến thức Cloudflare

rtd-cafe **không dạy bạn Cloudflare**  
rtd-cafe **không che giấu logic cấu hình**

Tất cả rule đều dựa trên các nguyên tắc đã được công bố công khai tại:

- https://wpsila.com/bao-mat-wp/
- https://blog.wpsila.com/cache-rules-trong-cloudflare/

👉 Nếu bạn không hiểu các tài liệu trên, **bạn không nên dùng tool này**.

---

## 5. Không chịu trách nhiệm cho cấu hình sai

rtd-cafe cung cấp công cụ **“as-is”**:

- Không bảo hành
- Không cam kết phù hợp cho mọi trường hợp
- Không chịu trách nhiệm cho downtime, cache sai hoặc chặn nhầm do người dùng áp dụng

Người dùng **tự chịu trách nhiệm** với hệ thống của mình.

---

## 6. Ưu tiên sự rõ ràng hơn sự tiện lợi

Triết lý của rtd-cafe:

- Ít tính năng nhưng rõ ràng
- Ít tùy chọn nhưng dễ kiểm soát
- Cấu hình đúng ngay từ đầu, dùng lâu dài

Nếu bạn tìm một tool:
- Nhiều checkbox
- Tự động hóa mọi thứ
- Che giấu logic phía sau giao diện đẹp

→ rtd-cafe **không phải lựa chọn phù hợp**.

---

## 7. Tự do chỉnh sửa – tự chịu trách nhiệm

Sau khi chạy rtd-cafe:

- Bạn hoàn toàn có thể chỉnh sửa, thêm, xóa rule trực tiếp trong Cloudflare
- Tool không khóa, không can thiệp, không theo dõi

rtd-cafe **không giữ quyền kiểm soát**, chỉ hỗ trợ khởi tạo cấu hình ban đầu.

---

Nếu bạn đã đọc đến đây và vẫn thấy rtd-cafe phù hợp, bạn chính là **đối tượng người dùng mà công cụ này hướng tới**.

