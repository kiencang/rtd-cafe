# ⚠️ DISCLAIMERS (TUYÊN BỐ TỪ CHỐI TRÁCH NHIỆM)

Tài liệu này nhằm làm rõ phạm vi sử dụng và giới hạn của **rtd-cafe**.
**Nếu bạn không đồng ý với các điều dưới đây, xin vui lòng KHÔNG sử dụng công cụ này.**

---

## 1. rtd-cafe KHÔNG dành cho mọi người
**rtd-cafe không phải là công cụ:**

❌ Dành cho người mới làm quen với Cloudflare.

❌ Dành cho người không hiểu Cache Rules, WAF, Rate Limit là gì.

❌ Dành cho ai muốn “bấm đại cho xong rồi sửa sau”.

**Công cụ này giả định rằng người dùng:**

✅ Hiểu mình đang làm gì.

✅ Hiểu hậu quả của việc overwrite (ghi đè) rule.

✅ Có khả năng tự rollback hoặc chỉnh sửa thủ công nếu cần.

---

## 2. Tool sẽ GHI ĐÈ toàn bộ rule hiện có
rtd-cafe sẽ **XÓA VÀ THAY THẾ** các Cache Rules, WAF Rules, Transform Rules hiện có trên Zone được áp dụng.

*   ⛔ **Không merge** (gộp rule cũ và mới).
*   ⛔ **Không giữ lại** bất kỳ rule cũ nào trong các phase tương ứng.
*   ⛔ **Không backup** tự động.

> 👉 **Lời khuyên:** Nếu bạn đang có cấu hình Cloudflare phức tạp hoặc tùy biến sâu, hãy cân nhắc kỹ và backup thủ công (chụp ảnh hoặc export Terraform) trước khi dùng.

---

## 3. Không phù hợp cho mọi loại website
**rtd-cafe chỉ được thiết kế tối ưu cho:**
*   Blog WordPress.
*   Website tin tức / Magazine.
*   Nội dung chủ yếu là đọc (**read-heavy**).

**rtd-cafe KHÔNG phù hợp cho:**
*   🛒 WooCommerce / Web bán hàng.
*   👥 Membership Site / LMS (Web học trực tuyến).
*   Web có logic cá nhân hóa cao (Dynamic Content).
*   Web phụ thuộc mạnh vào cookie / session riêng biệt.

---

## 4. Không thay thế kiến thức Cloudflare
rtd-cafe không dạy bạn Cloudflare. rtd-cafe không che giấu logic cấu hình.
Tất cả rule đều dựa trên các nguyên tắc đã được công bố công khai tại:

*   📖 [Bảo mật WordPress với Cloudflare](https://wpsila.com/bao-mat-wp/)
*   📖 [Cache Rules cho WordPress trên Cloudflare](https://blog.wpsila.com/cache-rules-trong-cloudflare/)

> 👉 Nếu bạn không hiểu các tài liệu trên, bạn không nên dùng tool này.

---

## 5. Không chịu trách nhiệm cho cấu hình sai
rtd-cafe cung cấp công cụ dưới dạng **“AS-IS”** (Nguyên trạng):

*   Không bảo hành.
*   Không cam kết phù hợp cho mọi trường hợp cụ thể.
*   Không chịu trách nhiệm cho downtime, cache sai, mất doanh thu hoặc chặn nhầm do người dùng áp dụng.

**Người dùng tự chịu trách nhiệm hoàn toàn với hệ thống của mình.**

---

## 6. Ưu tiên sự rõ ràng hơn sự tiện lợi
Triết lý của rtd-cafe là:
*   Ít tính năng nhưng **rõ ràng**.
*   Ít tùy chọn nhưng **dễ kiểm soát**.
*   Cấu hình đúng ngay từ đầu, dùng lâu dài.

Nếu bạn tìm một tool:
*   Có hàng tá checkbox.
*   Tự động hóa mọi thứ (magic).
*   Che giấu logic phía sau một giao diện đẹp đẽ.

→ **rtd-cafe không phải lựa chọn phù hợp.**

---

## 7. Tự do chỉnh sửa – Tự chịu trách nhiệm
Sau khi chạy rtd-cafe:
*   Bạn hoàn toàn có thể chỉnh sửa, thêm, xóa rule trực tiếp trong Cloudflare Dashboard.
*   Tool không khóa, không can thiệp, không theo dõi (tracking).
*   rtd-cafe không giữ quyền kiểm soát, chỉ hỗ trợ khởi tạo cấu hình ban đầu.

---


**Nếu bạn đã đọc đến đây và vẫn thấy rtd-cafe phù hợp, xin chúc mừng! Bạn chính là đối tượng người dùng mà công cụ này hướng tới.** 🚀
