# Changelog

Tất cả những thay đổi đáng chú ý của dự án rtd-cafe sẽ được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Thêm cơ chế kiểm tra trước các quy tắc (rules) có sẵn trong Zone định chỉnh sửa.
- Hiển thị thông báo cảnh báo để người dùng biết trước khi thao tác.

## [1.0.20z] - 2026-01-19

### Removed
- Loại bỏ hộp summary (tóm tắt thông tin tên miền & IP) gây rối giao diện.
- Sửa ở giao diện (index.html) & js (script.js) để loại bỏ các phần liên quan.

## [1.0.20y] - 2026-01-19

### Changed
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

### Added
- Thêm 2 quy tắc chặn file (file blocking rules) vào bộ quy tắc bảo mật số 2.






