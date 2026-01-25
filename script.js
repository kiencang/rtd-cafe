// --- File: script.js ---
// 1. Hàm bảo mật: Escape HTML để chống XSS
// Bất cứ khi nào hiển thị input của người dùng ra màn hình, phải dùng hàm này.
// Nó thay thế các mã lệnh bằng văn bản thường. Các mã lệnh được thay thế bao gồm:
// $, <, >, ', "
// Điều đó giúp vô hiệu hóa các câu lệnh lừa người dùng nhập vào để ăn trộm cookie
const escapeHTML = (str) => {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
};

// --- CẤU HÌNH ---
const WORKER_URL = "https://rtd-cafe-settings.wpsila.com/rtd-cafe-worker-api"; 

const form = document.getElementById('cfForm');
const statusDiv = document.getElementById('status');
const btn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
	
	// --- CLEAN INPUT & UPDATE UI ---
    // Lấy element
    const zoneIdEl = document.getElementById('zoneId');
    const tokenEl = document.getElementById('token');
    
    // Logic: Trim xong gán ngược lại vào value để người dùng thấy nó đã được làm sạch
    zoneIdEl.value = zoneIdEl.value.trim(); 
    tokenEl.value = tokenEl.value.trim();

    // Lấy giá trị đã sạch để dùng
	let clean_zoneId = zoneIdEl.value; 
	let clean_token = tokenEl.value;
	
    // 0. VALIDATE ZONE ID (Kiểm tra chặt chẽ sau khi đã làm sạch)
    // Regex: Chỉ chấp nhận 32 ký tự, gồm số 0-9 và chữ a-f (không phân biệt hoa thường)
    const zoneIdRegex = /^[a-f0-9]{32}$/i;

    if (!zoneIdRegex.test(clean_zoneId)) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'error';
        
        // Kiểm tra xem người dùng có nhập nhầm cái gì đó quá ngắn hoặc quá dài không
        let extraMsg = ""; // biến, thông tin thay đổi tùy theo kết quả kiểm tra.
		
		// Cơ sở của điều này là chúng ta đã biết chắc chắn rằng Zone ID của Cloudflare tạo ra chỉ có 32 ký tự.
        if (clean_zoneId.length < 32) extraMsg = "[Quá ngắn, có vẻ bạn copy thiếu]";
        else if (clean_zoneId.length > 32) extraMsg = "[Quá dài, có vẻ bạn copy thừa ký tự lạ]";

        statusDiv.innerHTML = `
            <strong>❌ Zone ID không hợp lệ:</strong><br>
            Giá trị bạn nhập: "<em>${escapeHTML(clean_zoneId)}</em>" <br>
            Zone ID bắt buộc phải là chuỗi <strong>32 ký tự</strong> (gồm số và chữ cái a-f).<br>
            ${extraMsg}
        `;
        // Scroll xuống thông báo lỗi để người dùng thấy
        statusDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return; 
    }	

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
            Bạn nhập: "<em>${escapeHTML(rawDomain)}</em>"<br>
            Vui lòng nhập đúng định dạng (VD: example.com, blog.wpsila.com). Đừng bao gồm http:// hay đường dẫn con.
        `;
        // Scroll xuống thông báo lỗi để người dùng thấy
        statusDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });		
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
            Bạn nhập: "<em>${escapeHTML(serverIp)}</em>"<br>
            Vui lòng chỉ nhập địa chỉ IP (VD: 113.161.x.x hoặc IPv6).<br>
            Tuyệt đối không nhập tên miền hay URL vào ô này.
        `;
        // Scroll xuống thông báo lỗi để người dùng thấy
        statusDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });		
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
        zoneId: clean_zoneId,
        token: clean_token,
        domain: cleanDomain,
        server_ip: serverIp,
        turnstileToken: turnstileToken
    };      

	// UI Loading
	btn.disabled = true;
	btn.innerHTML = "⏳ Đang kết nối API Cloudflare...";

	// 🔒 Freeze form
	form.querySelectorAll('input:not([name="cf-turnstile-response"])')
		.forEach(i => i.disabled = true);

    statusDiv.style.display = 'block';
    statusDiv.className = 'loading';
    statusDiv.innerText = "Đang gửi lệnh cấu hình...";
	
    // 5. Setup Timeout 30 giây
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 giây timeout

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data), 
            signal: controller.signal
        });

        // Xóa timeout ngay khi nhận được phản hồi từ server
        clearTimeout(timeoutId);

        const result = await response.json();

        if (response.ok && result.success) {
            statusDiv.className = 'success';
            statusDiv.innerHTML = `
                <h3>✅ Hoàn thành xuất sắc nhiệm vụ!</h3>
                <p>Website <strong>${escapeHTML(data.domain)}</strong> (IP: <strong>${escapeHTML(data.server_ip)}</strong>) đã được tối ưu:</p>
                <ul style="text-align: left; margin-bottom: 0;">
                    <li>Đã tạo 6 Cache Rules (chuẩn Blog & tăng tốc Admin).</li>
                    <li>Đã kích hoạt Bảo mật Login & chặn Bot rác.</li>
                    <li>Đã giới hạn Rate Limit trang đăng nhập.</li>
                    <li>Đã xóa Query Tracking phổ biến.</li>
                </ul>
                <p style="margin-bottom: 0; margin-top: 10px;">Hãy vào Cloudflare Dashboard kiểm tra lại nhé!</p>
            `;
			// Scroll xuống thông báo thành công để người dùng thấy
            statusDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });    
            form.reset();
            if (window.turnstile) turnstile.reset();
        } else {
            throw new Error(result.message || "Lỗi không xác định từ Cloudflare.");
        }
    } catch (error) {
        statusDiv.className = 'error';
        
        // ✅ Xử lý riêng lỗi Timeout để thông báo thân thiện hơn
        if (error.name === 'AbortError') {
            statusDiv.innerHTML = `
                <strong>❌ Quá thời gian chờ (Timeout):</strong><br>
                Hệ thống không phản hồi sau 30 giây. Có thể mạng bị nghẽn hoặc Cloudflare đang xử lý chậm.<br>
                Vui lòng thử lại sau ít phút.
            `;
        } else {
            statusDiv.innerHTML = `
                <strong>❌ Có lỗi xảy ra:</strong><br>
                ${escapeHTML(error.message)}
            `;
        }
        // Scroll xuống thông báo lỗi để người dùng thấy
        statusDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });    
        if (window.turnstile) turnstile.reset(); 
    } finally {
		btn.disabled = false;
		btn.innerText = "🚀 Triển khai & Ghi đè Rules";
		
		// Gỡ vô hiệu hóa các trường nhập liệu
		form.querySelectorAll('input').forEach(i => i.disabled = false);
}
});

// Con mắt ẩn hiện cho API Token
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