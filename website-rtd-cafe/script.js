// --- CẤU HÌNH ---
const WORKER_URL = "https://rtd-cafe-settings.wpsila.com/rtd-cafe-worker-api"; 

const form = document.getElementById('cfForm');
const statusDiv = document.getElementById('status');
const btn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Lấy và làm sạch tên miền trước
    let rawDomain = document.getElementById('domain').value.trim();
    // Loại bỏ protocol (http, https) và dấu / ở cuối, chuyển về chữ thường
    let cleanDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();

    // 2. Validate tên miền bằng Regex
    const domainRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

    if (!domainRegex.test(cleanDomain)) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'error';
        statusDiv.innerHTML = `
            <strong>❌ Tên miền không hợp lệ:</strong><br>
            Bạn nhập: "<em>${rawDomain}</em>"<br>
            Vui lòng nhập đúng định dạng (VD: example.com, wpsila.com). Đừng bao gồm http:// hay đường dẫn con.
        `;
        return; 
    }
	
    // ============================================================
    // 👇 BẮT ĐẦU PHẦN THÊM MỚI (SANITY CHECK IP) 👇
    // ============================================================
    
    // Lấy giá trị IP để kiểm tra
    let serverIp = document.getElementById('server_ip').value.trim();

    // Hàm kiểm tra hợp lý (Sanity Check)
    const isIpLike = (str) => {
        // IPv4: Trông giống 4 nhóm số (VD: 1.2.3.4) - Chấp nhận sai số nhỏ, chặn text/url
        const looksLikeIPv4 = str.split('.').length === 4 && /^[0-9.]+$/.test(str);

        // IPv6: Có ít nhất 2 dấu hai chấm và chỉ chứa Hex (VD: 2001:db8::1)
        const looksLikeIPv6 = str.split(':').length >= 3 && /^[0-9a-fA-F:]+$/.test(str);

        return looksLikeIPv4 || looksLikeIPv6;
    };

    if (!isIpLike(serverIp)) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'error';
        statusDiv.innerHTML = `
            <strong>❌ IP Máy chủ không hợp lệ:</strong><br>
            Bạn nhập: "<em>${serverIp}</em>"<br>
            Vui lòng chỉ nhập địa chỉ IP (VD: 113.161.x.x hoặc IPv6).<br>
            Tuyệt đối không nhập tên miền hay URL vào ô này.
        `;
        return; // Dừng lại, không gửi request
    }
    // ============================================================
    // 👆 KẾT THÚC PHẦN THÊM MỚI 👆
    // ============================================================	
    
    // 3. Lấy Token Turnstile
    const formData = new FormData(form);
    const turnstileToken = formData.get('cf-turnstile-response');

    if (!turnstileToken) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'error';
        statusDiv.innerHTML = '<strong>❌ Vui lòng xác thực bạn không phải là Robot!</strong>';
        return;
    }

    // 4. Đóng gói data
    const data = {
        zoneId: document.getElementById('zoneId').value.trim(),
        token: document.getElementById('token').value.trim(),
        domain: cleanDomain,
        server_ip: serverIp,
        turnstileToken: turnstileToken
    };      

    // UI Loading
    btn.disabled = true;
    btn.innerHTML = "⏳ Đang kết nối API Cloudflare...";
    statusDiv.style.display = 'block';
    statusDiv.className = 'loading';
    statusDiv.innerText = "Đang gửi lệnh cấu hình...";

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            statusDiv.className = 'success';
            statusDiv.innerHTML = `
                <h3>✅ Thành công rực rỡ!</h3>
                <p>Website <strong>${data.domain}</strong> đã được tối ưu:</p>
                <ul style="text-align: left; margin-bottom: 0;">
                    <li>Đã tạo 6 Cache Rules (chuẩn Blog & tăng tốc Admin).</li>
                    <li>Đã kích hoạt chặn Bot & Bảo mật Login.</li>
                    <li>Đã giới hạn Rate Limit trang đăng nhập.</li>
                    <li>Đã xóa Query Tracking phổ biến.</li>
                </ul>
                <p style="margin-bottom: 0; margin-top: 10px;">Hãy vào Cloudflare Dashboard kiểm tra lại nhé!</p>
            `;
            form.reset();
            if (window.turnstile) turnstile.reset();
        } else {
            throw new Error(result.message || "Lỗi không xác định từ Cloudflare.");
        }
    } catch (error) {
        statusDiv.className = 'error';
        statusDiv.innerHTML = `
            <strong>❌ Có lỗi xảy ra:</strong><br>
            ${error.message}<br><br>
            <em>Kiểm tra lại Zone ID, Token hoặc quyền hạn của Token.</em>
        `;
        if (window.turnstile) turnstile.reset(); 
    } finally {
        btn.disabled = false;
        btn.innerText = "🚀 Triển khai ngay";
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const tokenInput = document.getElementById('token');
    const toggleBtn = document.getElementById('toggleToken');
    const eyeOpen = toggleBtn.querySelector('.eye-open');
    const eyeClosed = toggleBtn.querySelector('.eye-closed');

    if (toggleBtn && tokenInput) {
        toggleBtn.addEventListener('click', function() {
            // Kiểm tra trạng thái hiện tại
            const type = tokenInput.getAttribute('type') === 'password' ? 'text' : 'password';
            tokenInput.setAttribute('type', type);
            
            // Đổi icon
            if (type === 'text') {
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            } else {
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            }
        });
    }
});