# Changelog

Tất cả những thay đổi đáng chú ý của dự án rtd-cafe sẽ được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Riêng chỉ sửa nhỏ giao diện mà không động đến worker.js sẽ sử dụng thêm giá trị f1, f2, f3,... đằng sau.

Ví dụ 1.0.26.f1 nghĩa là phiên bản này có lõi (worker.js) giống y phiên bản 1.0.26, chỉ có fontend là chỉnh sửa nhỏ.

## [Unreleased]
### Added
- Thêm cơ chế kiểm tra trước các quy tắc (rules) có sẵn trong Zone định chỉnh sửa.
- Hiển thị thông báo cảnh báo để người dùng biết trước khi thao tác.

## [1.0.29] - 2026-01-25

### Fixed
- Nâng cấp bộ chặn file nhạy cảm (waf).
- Nâng cấp bộ lọc bot tự đông (waf).

## [1.0.28] - 2026-01-25

### Fixed
- Xóa link không cần thiết trong Content-Security-Policy để đảm bảo an toàn hơn.
- Bổ sung timeout ở frontend (backend đã có từ trước).
- Cập nhật lại rule waf (rule liên quan đến comment và rule vào trang login) để nó mạnh và chính xác hơn.

## [1.0.27] - 2026-01-23

### Fixed
Thông báo lỗi chuẩn xác hơn. Mục đích là để người dùng cuối rõ lỗi hơn, và biết khắc phục chỗ nào.
- Nếu sai API Token hoặc Zone ID thì thông báo lỗi này.
- Nếu đã đúng API Token và Zone ID nhưng thiếu quyền (ví dụ vẫn để read chứ không phải edit) thì phải thông báo lỗi cụ thể này.

## [1.0.26x] - 2026-01-22

### Fixed
- Chỉnh thêm Content-Security-Policy để chống nhúng iframe, và một số nguyên tắc cơ bản khác.

## [1.0.26] - 2026-01-21

### Fixed
- Hạn chế tấn công XSS, bằng cách lọc (escapeHTML) dữ liệu người dùng nhập.
- Khóa nguồn (Content-Security-Policy) các file, mã có thể được thực thi.
- Validate cả ở backend cho Zone ID, domain, IP.

## [1.0.25] - 2026-01-21

### Fixed
- Sửa thứ tự các khối rule cho dễ debug hơn sau này.
- Thay dấu nháy kép bằng dấu backtick trong expression để sau dễ copy paste lệnh hơn.

## [1.0.24] - 2026-01-20

### Fixed
- Sửa phần rule liên quan đến bình luận spam. Bổ sung thêm danh sách IP từ các quốc gia thường là nguồn tấn công hoặc spam.

## [1.0.23] - 2026-01-20

### Fixed
- Chỉnh sửa để phần xóa query tracking chính xác hơn, không xóa nhầm toàn bộ khi có thêm tham số phụ.

## [1.0.22x] - 2026-01-19

### Fixed
- Cải thiện nhỏ về giao diện cho hành vi thông báo thiết lập thành công cache rules & waf

## [1.0.22] - 2026-01-19

### Fixed
- Validate chặt hơn cho Zone ID.
- Thông báo lỗi mượt hơn bằng cách chuyển đến vùng báo lỗi khi có thông báo (người dùng không cần lăn chuột đế thấy). 

## [1.0.21x] - 2026-01-19

### Fixed
- Chỉnh sửa giao diện, thêm icon & sửa CSS tên ứng dụng để trang đẹp và tiện dùng hơn. 

## [1.0.21] - 2026-01-19

### Fixed
- Sửa tính năng ngày giờ khởi tạo theo thời gian thực (VN) vào tên các Rules. 

## [1.0.20z] - 2026-01-19

### Removed
- Loại bỏ hộp summary (tóm tắt thông tin tên miền & IP) gây rối giao diện.
- Sửa ở giao diện (index.html) & js (script.js) để loại bỏ các phần liên quan.

## [1.0.20y] - 2026-01-19

### Fixed
- Cho hộp xác thực không phải là robot lên cao thêm và gán nhãn cho nó. Mục đích là để tránh người dùng hiểu nhầm thông tin.
- Tăng thời gian hiển thị box tóm tắt thông tin lên 4s.

## [1.0.20x] - 2026-01-18

### Changed
- Thời gian hiển thị box thông tin người dùng nhập dài hơn.
- Báo lỗi nhìn thu hút hơn để user tránh hiểu nhầm thông tin.

### Fixed
- Chỉnh giao script.js để tăng thời gian từ 1500ms lên 3000ms
- Chỉnh style.css để box thông báo lỗi (class .error) rõ ràng, thu hút hơn.

## [1.0.20] - 2026-01-18

### Changed
- Chỉnh sửa thông báo để người dùng khỏi hiểu nhầm không thành công là thành công.
- Chuyển ngày giờ về cuối tên để tránh hiều nhầm

### Fixed
- Chỉnh giao diện index.html, chuyển 'Thành công rực rỡ!' thành 'Hoàn thành xuất sắc nhiệm vụ!'
- Chỉnh worker.js để nó chuyển thời điểm về cuối tên để không che mất tên rules ở giao diện.

## [1.0.19] - 2026-01-18

### Changed
- Cập nhật giao diện để nó phản hồi chính xác hơn các cảnh báo.
- Đặt tên rule chính xác hơn để phản ánh phiên bản và thời điểm tạo phiên bản.

### Fixed
- Chỉnh file CSS, JS, index để các phản hồi trong giao diện chính xác hơn.
- Chỉnh worker.js để nó đặt tên các rule theo phiên bản và thời điểm triển khai.

## [1.0.18] - 2026-01-18

### Changed
- Cập nhật phản hồi cho CORS Preflight (OPTIONS) sang HTTP 204 (No Content) thay vì 200.
- Loại bỏ cơ chế fallback giá trị mặc định (IP ảo) để đảm bảo tính chính xác cho Rules.

### Fixed
- Thêm `AbortSignal.timeout(10000)` để ngăn Worker bị treo khi gọi API quá lâu.
- Sửa lỗi logic validate: Bắt buộc kiểm tra đầy đủ Zone ID, Token, Domain và IP trước khi chạy.

## [1.0.17] - 2026-01-18

### Changed

- Cập nhật cấu hình bảo mật để tăng cường an toàn hệ thống (liên quan đến các quy tắc chặn file mới).

### Fixed
- Thêm 2 quy tắc chặn file (file blocking rules) vào bộ quy tắc bảo mật số 2.

























