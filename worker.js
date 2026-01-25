/**
 * Tăng tốc và bảo mật cho WordPress bằng Cloudflare
 * Chức năng: Tự động cấu hình Cache Rules, WAF, Transform Rules và Rate Limiting.
 * Có tích hợp Turnstile để chống lạm dụng worker.
 * Thuộc dự án: rtd-cafe
 * Link ứng dụng: https://rtd-cafe.wpsila.com (index.html & file css, js liên quan).
 * Link của worker.js: https://rtd-cafe-settings.wpsila.com/rtd-cafe-worker-api (chặn truy cập trực tiếp, chỉ gọi được qua ứng dụng).
 * Tác giả: wpsila - Nguyễn Đức Anh
 */
 // -------------------------------------------------------------------------------------------------------------------------------- 
const RTD_CAFE_VERSION = "v1.0.30"; // Phiên bản của script
// -------------------------------------------------------------------------------------------------------------------------------- 

// +++

// --------------------------------------------------------------------------------------------------------------------------------
// [1] --- BẮT ĐẦU ĐOẠN MÃ MỚI: HÀM KIỂM TRA KẾT NỐI (FINAL FIXED) ---
// Kiểm tra sớm Zone ID và API Token có hợp lệ không, mục đích để thông báo sớm lỗi cho user.
// Lỗi nhập sai Zone ID và API Token có khả năng dễ xảy ra khi người dùng mới thiết lập lần đầu.
async function validateCloudflareConnection(zoneId, token) {
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  // Thay vì check thông tin Zone (cần quyền Zone:Read), ta check thẳng vào Cache Rules (cần quyền Cache:Edit/Read).
  // Vì Token của bạn chắc chắn có quyền Cache Rules, nên cách này sẽ hoạt động 100%.
  
  // Endpoint này lấy thông tin cấu hình Cache Rules hiện tại
  const testUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_request_cache_settings/entrypoint`;

  try {
    const resp = await fetch(testUrl, {
        method: "GET", headers: headers
    });
    const json = await resp.json();

    // Nếu Cloudflare trả về lỗi (4xx, 5xx) hoặc success: false
    if (!resp.ok || !json.success) {
      // Logic phân tích lỗi
      let reason = "Nguyên nhân có thể do:\n1. Zone ID không chính xác (bạn có copy nhầm Zone ID của tên miền khác không?).\n2. API Token sai, đã đổi mới hoặc hết hạn.\n3. Token chưa được cấp quyền vào Zone này (khi tạo API Token bạn có chỉ định chính xác Zone tương ứng với tên miền không?).";

      return { 
        ok: false, 
        message: `❌ Kết nối thất bại!\n${reason}\n-> Hãy kiểm tra lại Zone ID và Token.` 
      };
    }
  } catch (e) {
     return { ok: false, message: "Lỗi kết nối mạng khi kiểm tra API (Network Error)." };
  }

  // Nếu gọi được vào Cache Rules -> Chứng tỏ Token Sống + Zone ID Đúng + Có quyền truy cập.
  return { ok: true };
}
// [1] --- KẾT THÚC ĐOẠN MÃ MỚI ---
// -------------------------------------------------------------------------------------------------------------------------------- 

// +++

// =========================================================================
// 1. HÀM TẠO WAF RULES (BẢO MẬT) - CẦN IP & DOMAIN
// =========================================================================
// Lưu ý ở trong expression, các dấu nháy " được bổ sung thành \" để không lỗi cú pháp.
// Nếu dùng `` cho expression thì không cần \" cho dấu nháy kép.
// domain: biến tên miền
// vpsIP: biến IP của VPS, dùng làm whitelist
// DEPLOYED_AT là thời gian chạy lệnh, được gắn vào tên rule 
const get_MY_WAF_RULES = (domain, vpsIP, DEPLOYED_AT) => [
  // Bảo mật 1: Whitelist IP VPS
  // Rule quan trọng để tránh chặn chính mình khi bản thân WordPress thực thi một số tác vụ quay về chính VPS.
  {
    "action": "skip",
    "action_parameters": { "ruleset": "current" },
    "description": `Security rules 1 [rtd-cafe-${RTD_CAFE_VERSION}]: Không chặn chính mình (IP của VPS) [deployed: ${DEPLOYED_AT}]`,
    "enabled": true,
    "expression": `(ip.src eq ${vpsIP})` // Cho dấu nháy kép như thế này "${vpsIP}" sẽ bị lỗi
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Bảo mật 2: Chặn file nhạy cảm
  // Một danh sách dài các file chứa thông tin quan trọng không được để lộ ra ngoài.
  {
    "action": "block",
    "description": `Security rules 2 [rtd-cafe-${RTD_CAFE_VERSION}]: Chặn truy cập các file nhạy cảm [deployed: ${DEPLOYED_AT}]`,
    "enabled": true,
	"expression": `(http.request.uri.path contains "/xmlrpc.php") or (http.request.uri.path contains "/wp-config.php") or (http.request.uri.path contains ".htaccess") or (http.request.uri.path contains "/.env") or (http.request.uri.path contains "composer.json") or (http.request.uri.path contains "composer.lock") or (http.request.uri.path contains "package.json") or (http.request.uri.path contains "package-lock.json") or (http.request.uri.path contains "yarn.lock") or (http.request.uri.path contains "/.git/") or (http.request.uri.path contains ".DS_Store") or (http.request.uri.path contains "/wp-includes/wlwmanifest.xml") or (ends_with(http.request.uri.path, ".log")) or (ends_with(http.request.uri.path, "error_log")) or (ends_with(http.request.uri.path, ".sql")) or (ends_with(http.request.uri.path, ".bak")) or (ends_with(http.request.uri.path, ".old")) or (ends_with(http.request.uri.path, ".save")) or (ends_with(http.request.uri.path, ".ini")) or (ends_with(http.request.uri.path, ".conf")) or (ends_with(http.request.uri.path, ".yaml")) or (ends_with(http.request.uri.path, ".yml")) or (ends_with(http.request.uri.path, "readme.html")) or (ends_with(http.request.uri.path, "license.txt")) or (ends_with(http.request.uri.path, ".git")) or (http.request.uri.path contains "/wp-content/uploads/" and http.request.uri.path contains ".php")`
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Bảo mật 3: Bảo vệ Login & Admin & JSON
  // Thử thách bằng managed_challenge, một trong các giải pháp rất mạnh để hạn chế bot.
  {
    "action": "managed_challenge",
    "description": `Security rules 3 [rtd-cafe-${RTD_CAFE_VERSION}]: Hạn chế bot vào trang login, admin và wp-json [deployed: ${DEPLOYED_AT}]`,
    "enabled": true,
    "expression": `(http.request.uri.path contains "/wp-login.php" and not cf.client.bot) or (starts_with(http.request.uri.path, "/wp-admin/") and not http.request.uri.path contains "/wp-admin/admin-ajax.php" and not http.request.uri.path contains "/wp-admin/css/" and not http.request.uri.path contains "/wp-admin/js/" and not http.request.uri.path contains "/wp-admin/images/") or (http.request.uri.path contains "/wp-json/" and not http.referer contains "${domain}" and not cf.client.bot)`
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Bảo mật 4: Hạn chế Bot rác
  // Thử thách bằng managed_challenge
  // Điều kiện quan trọng là bot đó phải không thuộc nhóm bot lành tính trong danh sách cf.client.bot
  {
    "action": "managed_challenge",
    "description": `Security rules 4 [rtd-cafe-${RTD_CAFE_VERSION}]: Hạn chế bot rác [deployed: ${DEPLOYED_AT}]`,
    "enabled": true,
    "expression": `(http.user_agent eq "" and not cf.client.bot) or (http.user_agent contains "go-http" and not cf.client.bot) or (http.user_agent contains "axios" and not cf.client.bot) or (http.user_agent contains "wpscan" and not cf.client.bot) or (http.user_agent contains "sqlmap" and not cf.client.bot) or (http.user_agent contains "nmap" and not cf.client.bot) or (http.user_agent contains "headless" and not cf.client.bot) or (http.user_agent contains "selenium" and not cf.client.bot) or (http.user_agent contains "python" and not cf.client.bot) or (http.user_agent contains "libwww-perl" and not cf.client.bot) or (http.user_agent contains "java" and not cf.client.bot) or (http.user_agent contains "wget" and not cf.client.bot) or (http.user_agent contains "curl" and not cf.client.bot) or (http.user_agent contains "WinHttp" and not cf.client.bot) or (http.user_agent contains "HTTrack" and not cf.client.bot) or (http.user_agent contains "Indy Library" and not cf.client.bot) or (http.request.method eq "POST" and http.referer eq "" and not cf.client.bot)`
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Bảo mật 5: Hạn chế Spam Comment
  // Thử thách bằng managed_challenge
  // Bổ sung danh sách IP 10 quốc gia thường là nguồn tấn công hoặc spam
  {
    "action": "managed_challenge",
    "description": `Security rules 5 [rtd-cafe-${RTD_CAFE_VERSION}]: Hạn chế spam bình luận [deployed: ${DEPLOYED_AT}]`,
    "enabled": true,
    "expression": `(http.request.uri.path eq "/wp-comments-post.php" and http.request.method eq "POST" and not cf.client.bot and not http.referer contains "${domain}") or (http.request.uri.path eq "/wp-comments-post.php" and http.request.method eq "POST" and not cf.client.bot and ip.src.country in {"CN" "RU" "UA" "IN" "ID" "PK" "BD" "BR" "TR" "IR"}) or (http.request.uri.path eq "/wp-comments-post.php" and http.request.method eq "POST" and not cf.client.bot and http.user_agent eq "") or (http.request.uri.path eq "/wp-comments-post.php" and http.request.method eq "POST" and not cf.client.bot and http.request.version eq "HTTP/1.0")`
  }
];
// --------------------------------------------------------------------------------------------------------------------------------

// +++

// --------------------------------------------------------------------------------------------------------------------------------
// =========================================================================
// 2. CẤU HÌNH RATE LIMITING (GIỚI HẠN TỐC ĐỘ)
// Chống việc bị tấn công vào trang login của WordPress (wp-login.php).
// Có thể mở rộng thêm các trang khác bằng cú pháp OR trong khi điều chỉnh rule thủ công.
// =========================================================================
const get_MY_RATE_LIMIT_RULES = (DEPLOYED_AT) => [
  {
    "action": "block",
    "ratelimit": {
      // QUAN TRỌNG: Gói Free bắt buộc phải có "cf.colo.id"
      "characteristics": ["cf.colo.id", "ip.src"], 
      "period": 10, // Trong 10 giây
      "requests_per_period": 5, // Tối đa 5 lần
      "mitigation_timeout": 10 // Chặn 10 giây
    },
    "description": `Rate limit [rtd-cafe-${RTD_CAFE_VERSION}]: Giới hạn số lần vào trang đăng nhập [deployed: ${DEPLOYED_AT}]`,
    "enabled": true,
    "expression": `(http.request.uri.path contains "/wp-login.php")`
  }
];
// --------------------------------------------------------------------------------------------------------------------------------

// +++

// --------------------------------------------------------------------------------------------------------------------------------
// =========================================================================
// 3. CẤU HÌNH TRANSFORM RULES (URL REWRITE)
// Đảm bảo vẫn duy trì được hiệu suất cao khi trang được chia sẻ trên các nền tảng mạng xã hội
// =========================================================================
const get_MY_TRANSFORM_RULES = (DEPLOYED_AT) => [
  {
    "action": "rewrite",
    "action_parameters": { "uri": { "query": { "value": "" } } },
    "description": `Transform rules 1 [rtd-cafe-${RTD_CAFE_VERSION}]: Xóa các query tracking phổ biến (fbclid, utm...) [deployed: ${DEPLOYED_AT}]`,
    "enabled": true,
	// Đã thêm dấu = vào sau các ID để chính xác tuyệt đối. Riêng utm_ giữ nguyên.
	// Điều kiện not http.request.uri.query contains & là để đảm bảo chỉ xóa toàn bộ query nếu nó có duy nhất một query tương ứng, tránh xóa toàn bộ query trong trường hợp như ?search=iphone&fbclid=123
    "expression": `(starts_with(http.request.uri.query, "fbclid=") and not http.request.uri.query contains "&") or (starts_with(http.request.uri.query, "utm_") and not http.request.uri.query contains "&") or (starts_with(http.request.uri.query, "gclid=") and not http.request.uri.query contains "&") or (starts_with(http.request.uri.query, "ttclid=") and not http.request.uri.query contains "&") or (starts_with(http.request.uri.query, "wbraid=") and not http.request.uri.query contains "&") or (starts_with(http.request.uri.query, "gbraid=") and not http.request.uri.query contains "&") or (starts_with(http.request.uri.query, "msclkid=") and not http.request.uri.query contains "&") or (starts_with(http.request.uri.query, "yclid=") and not http.request.uri.query contains "&") or (starts_with(http.request.uri.query, "mc_cid=") and not http.request.uri.query contains "&") or (starts_with(http.request.uri.query, "_hsenc=") and not http.request.uri.query contains "&") or (starts_with(http.request.uri.query, "dclid=") and not http.request.uri.query contains "&")`
  }
];
// --------------------------------------------------------------------------------------------------------------------------------

// +++

// =========================================================================
// 4. CẤU HÌNH CACHE RULES (6 RULES)
// Cache ở phía Edge cho rule 1 có thể tăng thêm thành 3 ngày hoặc 1 tuần nếu có plugin xóa cache tự động.
// Cache phía trình duyệt cho html ở rule chỉ nên để trong khoảng từ 1 - 5 phút, không nên hơn.
// =========================================================================
const get_MY_CACHE_RULES = (DEPLOYED_AT) => [
// --------------------------------------------------------------------------------------------------------------------------------
  // Rule 1: Cache chung cho HTML (Bài viết, Trang chủ, Tag, Category...)
  {
    "action": "set_cache_settings", // Hành động thiết lập cache
    "action_parameters": { // Các tham số
      "cache": true, // Bật cache
	  // Lưu ý thời gian cache tính theo giây
      "edge_ttl": { "default": 28800, "mode": "override_origin" }, // Cache ở phía Edge (Cloudflare) 8 tiếng
      "browser_ttl": { "default": 180, "mode": "override_origin" } // Cache ở phía trình duyệt người dùng 3 phút
    },
    "description": `Cache rules 1 [rtd-cafe-${RTD_CAFE_VERSION}]: Quy tắc cache chung (HTML cache) [deployed: ${DEPLOYED_AT}]`, // Đặt tên cho quy tắc // phiên bản của rule
    "enabled": true, // Bật tính năng này
    // Loại trừ các file tĩnh (để Rule 2, 3 xử lý) và trang đăng nhập
    "expression": `(not http.request.uri.path contains "/wp-login.php" and not http.request.uri.path contains "/wp-admin" and not http.cookie contains "wordpress_logged_in_" and not http.request.uri.path.extension in {"css" "js" "woff" "woff2" "ttf" "otf" "eot" "map" "jpg" "png" "jpeg" "webp" "avif" "ico" "svg" "gif" "pdf" "mp3" "mp4" "webm"})`
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Rule 2: Cache CSS, JS, Font
  // CSS, JS thay đổi luôn kèm version nên có thể để cache lâu.
  // Các font hiếm khi thay đổi.
  {
    "action": "set_cache_settings",
    "action_parameters": {
      "cache": true,
      "edge_ttl": { "default": 2592000, "mode": "override_origin" }, // 1 tháng
      "browser_ttl": { "default": 604800, "mode": "override_origin" } // 7 ngày
    },
    "description": `Cache rules 2 [rtd-cafe-${RTD_CAFE_VERSION}]: Cache CSS, JS và font [deployed: ${DEPLOYED_AT}]`,
    "enabled": true,
    "expression": `(http.request.uri.path.extension in {"css" "js" "woff" "woff2" "ttf" "otf" "eot" "map"})`
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Rule 3: Cache Media (Ảnh, Video, PDF)
  // Các file tĩnh ảnh, pdf, media là thông tin hiếm khi thay đổi nhất, để cache dài được
  // Danh sách này sắp xếp theo mức độ thường gặp
  {
    "action": "set_cache_settings",
    "action_parameters": {
      "cache": true,
      "edge_ttl": { "default": 31536000, "mode": "override_origin" }, // 1 năm
      "browser_ttl": { "default": 2592000, "mode": "override_origin" } // 1 tháng
    },
    "description": `Cache rules 3 [rtd-cafe-${RTD_CAFE_VERSION}]: Cache ảnh, PDF, media [deployed: ${DEPLOYED_AT}]`,
    "enabled": true,
    "expression": `(http.request.uri.path.extension in {"jpg" "jpeg" "png" "ico" "svg" "gif" "webp" "avif" "pdf" "mp3" "mp4" "webm"})`
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Rule 4: Cache ngắn cho Sitemap & Feed
  // sitemap có mức độ cập nhật vừa phải, cache ngắn vừa đảm bảo hiệu suất, vừa không ảnh hưởng đến tính cập nhật
  {
    "action": "set_cache_settings",
    "action_parameters": {
      "cache": true,
      "edge_ttl": { "default": 28800, "mode": "override_origin" }, // 8 tiếng
      "browser_ttl": { "default": 28800, "mode": "override_origin" } // 8 tiếng
    },
    "description": `Cache rules 4 [rtd-cafe-${RTD_CAFE_VERSION}]: Cache ngắn cho Sitemap & Feed [deployed: ${DEPLOYED_AT}]`,
    "enabled": true,
    "expression": `(http.request.uri.path contains "sitemap") or (http.request.uri.path contains "/feed/")`
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Rule 5: Cache cho trang Admin (chỉ CSS, JS, font)
  // Cải tiến này giúp trang admin tải nhanh hơn. CSS & JS của admin luôn có version đi kèm.
  // Tuy vậy để chắc chắn cũng không nên để thời gian cache quá lâu.
  {
    "action": "set_cache_settings",
    "action_parameters": {
      "cache": true,
      "edge_ttl": { "default": 604800, "mode": "override_origin" }, // 7 ngày
      "browser_ttl": { "default": 14400, "mode": "override_origin" } // 4 tiếng
    },
    "description": `Cache rules 5 [rtd-cafe-${RTD_CAFE_VERSION}]: Cache cho trang Admin (chỉ CSS, JS và font) [deployed: ${DEPLOYED_AT}]`,
    "enabled": true,
    "expression": `(http.request.uri.path contains "/wp-admin" and http.request.uri.path.extension in {"css" "js" "woff" "woff2" "ttf" "otf" "eot"})`
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Rule 6: BYPASS CACHE (Quan trọng nhất - nằm cuối để ghi đè)
  // Danh sách này đặc biệt quan trọng để tránh cache lỗi. Tôn chỉ: Thà bỏ sót cache, còn hơn là cache nhầm.
  // Có thể cần bổ sung tùy theo trường hợp cụ thể của blog, hoặc có sự thay đổi của WordPress sau này (ít thường xuyên).
  {
    "action": "set_cache_settings",
    "action_parameters": { "cache": false },
    "description": `Cache rules 6 [rtd-cafe-${RTD_CAFE_VERSION}]: Bỏ qua không cache (Admin, Login, API) [deployed: ${DEPLOYED_AT}]`,
    "enabled": true,
    "expression": `(http.request.uri.path contains "/wp-admin" and not http.request.uri.path.extension in {"css" "js" "woff" "woff2" "ttf" "otf" "eot"}) or (http.request.uri.path contains "/wp-login.php") or (http.request.uri.path contains "/robots.txt") or (http.request.uri.path contains "/wp-json/") or (http.request.uri.query contains "rest_route=") or (http.request.uri.path contains "/xmlrpc.php") or (http.request.uri.path contains "/wp-cron.php") or (http.request.uri.query contains "doing_wp_cron=") or (http.cookie contains "wordpress_logged_in_") or (http.cookie contains "wp-postpass_") or (http.cookie contains "wordpress_sec_") or (http.cookie contains "comment_author_") or (http.request.uri.query contains "replytocom=") or (http.request.uri.query contains "unapproved=") or (http.request.uri.query contains "moderation-hash=") or (http.request.uri.query contains "preview=") or (http.request.uri.query contains "preview_id=") or (http.request.uri.query contains "preview_nonce=") or (http.request.uri.query contains "customize_changeset_uuid") or (http.request.uri.query contains "customize_preview=") or (http.request.uri.query contains "customize=") or (http.request.uri.query contains "_wpnonce") or (http.request.uri.query contains "s=") or (http.request.uri.query contains "action=") or (http.request.uri.query contains "elementor-preview") or (http.request.uri.query contains "fl_builder") or (http.request.uri.query contains "et_fb") or (http.request.uri.query contains "vc_editable") or (http.request.uri.query contains "bricks=") or (http.request.uri.query contains "tve=") or (http.request.uri.query contains "brizy-edit") or (http.request.uri.path contains "/wp-signup.php") or (http.request.uri.path contains "/wp-activate.php") or (http.request.uri.path contains "/wp-reset-password.php") or (http.request.uri.query contains "nocache")`
  }
];
// Đến đây là kết thúc phần logic cho các rule cần cài đặt.
// --------------------------------------------------------------------------------------------------------------------------------

// +++

// =========================================================================
// 5. MAIN LOGIC (WORKER API)
// Bắt đầu các logic tương tác với Cloudflare để đẩy các rule vào zone (tên miền) tương ứng.
// =========================================================================

// --------------------------------------------------------------------------------------------------------------------------------
export default {
  // Thêm tham số 'env' vào hàm fetch
  async fetch(request, env, ctx) { 
  
    // 0. LẤY CẤU HÌNH TỪ BIẾN MÔI TRƯỜNG (ENV)
    // Nếu quên đặt trong cài đặt, nó sẽ lấy giá trị mặc định sau dấu ||
	// TURNSTILE_SECRET_KEY thì bắt buộc phải thiết lập, không được quên
	// Biến môi trường cài đặt trong phần worker tương ứng chạy file này, phải đặt đúng tên
    const TURNSTILE_SECRET = env.TURNSTILE_SECRET_KEY; 
    const ALLOWED_ORIGIN = env.ALLOWED_ORIGIN || "https://rtd-cafe.wpsila.com";

    // Kiểm tra xem đã cấu hình Secret Key chưa
    if (!TURNSTILE_SECRET) {
      return new Response("Lỗi: Chưa cấu hình TURNSTILE_SECRET_KEY trong Worker Settings", { status: 500 });
    }
  
	// --------------------------------------------------------------------------------------------------------------------------------
	const corsHeaders = {
	  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
	  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
	  "Access-Control-Allow-Headers": "Content-Type",
	};
	// --------------------------------------------------------------------------------------------------------------------------------
	
    // =========================================================================
    // 1. KIỂM TRA ĐƯỜNG DẪN
    // =========================================================================
    const url = new URL(request.url);
    
    // Nếu đường dẫn KHÔNG phải là "/rtd-cafe-worker-api" thì trả về 404 luôn
	// Chuyển worker thành /rtd-cafe-worker-api để có thể giới hạn tần suất truy cập worker này
    if (url.pathname !== "/rtd-cafe-worker-api") {
      // Trả về lỗi 404 Not Found
      return new Response("Trang không tồn tại", { status: 404 });
    }
	
    // 1x. Handle CORS Preflight
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
	
	// =================================================================
    // [CẢI TIẾN] BẢO MẬT: KHÓA CHẶT ORIGIN
    // =================================================================
    const origin = request.headers.get("Origin");
    
    if (ALLOWED_ORIGIN !== "*") {
      // Nếu không có Origin (truy cập ẩn danh từ script) HOẶC Origin không khớp thì từ chối luôn
      if (!origin || origin !== ALLOWED_ORIGIN) {
        return new Response("Forbidden: Direct or Unauthorized Access Not Allowed", { 
          status: 403, 
          headers: corsHeaders 
        });
      }
    }
    // =================================================================
    
    // 2. Health Check
    if (request.method === "GET") return new Response("✅ Worker hoạt động tốt!", { status: 200, headers: corsHeaders });
    
    // 3. Method Check
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

    try {
      // Nhận thêm turnstileToken
      const { zoneId, token, domain, server_ip, turnstileToken } = await request.json();

      // =========================================================
      // [QUAN TRỌNG] XÁC THỰC TURNSTILE
      // =========================================================
      if (!turnstileToken) {
         return new Response(JSON.stringify({ success: false, message: "Thiếu mã xác thực Turnstile" }), { status: 403, headers: corsHeaders });
      }

      // Xác thực token với Cloudflare
      const ip = request.headers.get('CF-Connecting-IP');
      const formData = new FormData();
      formData.append('secret', TURNSTILE_SECRET);
      formData.append('response', turnstileToken);
      formData.append('remoteip', ip);

      const turnstileUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
	  const turnstileResult = await fetch(turnstileUrl, {
		  body: formData,
		  method: 'POST',
		  signal: AbortSignal.timeout(10000)  // 10 giây
	  });

      const outcome = await turnstileResult.json();

      // Nếu Token turnstile sai hoặc hết hạn -> Chặn ngay
      if (!outcome.success) {
        return new Response(JSON.stringify({ success: false, message: "Xác thực Captcha thất bại. Vui lòng thử lại." }), { status: 403, headers: corsHeaders });
      }
      
      // =========================================================
      // TOKEN HỢP LỆ -> CHẠY LOGIC CHÍNH
      // =========================================================

      // =========================================================
      // VALIDATE DỮ LIỆU ĐẦU VÀO (CHẶT CHẼ HƠN)
      // =========================================================
      
      // Kiểm tra tất cả các trường bắt buộc
      // Nếu thiếu bất kỳ trường nào trong 4 trường này -> Báo lỗi và Dừng ngay lập tức
      if (!zoneId || !token || !domain || !server_ip) {
        
        // Tạo thông báo lỗi cụ thể để biết thiếu cái gì (tuỳ chọn, giúp debug dễ hơn)
        let missingFields = [];
        if (!zoneId) missingFields.push("Zone ID");
        if (!token) missingFields.push("Token");
        if (!domain) missingFields.push("Domain");
        if (!server_ip) missingFields.push("Server IP");

        return new Response(JSON.stringify({ 
            success: false, 
            message: `Thiếu dữ liệu bắt buộc: ${missingFields.join(", ")}` 
        }), { 
            status: 400, 
            headers: corsHeaders 
        });
      }
	  
	// 1. Validate Zone ID (32 ký tự hex)
	if (!/^[a-f0-9]{32}$/i.test(zoneId)) {
		return new Response(JSON.stringify({ success: false, message: "Zone ID không hợp lệ (Backend check)" }), { status: 400, headers: corsHeaders });
	}

	// 2. Validate IP (Sơ bộ)
	// Kiểm tra không chứa ký tự lạ ngoài số, chấm, hai chấm (cho IPv6)
	if (!/^[0-9a-fA-F:.]+$/.test(server_ip)) {
		 return new Response(JSON.stringify({ success: false, message: "IP không hợp lệ (Backend check)" }), { status: 400, headers: corsHeaders });
	}

	// 3. Validate Domain (Không được chứa http, /, ký tự lạ)
	// Regex đơn giản để chống injection ký tự đặc biệt như " hoặc )
	if (!/^[a-z0-9.-]+$/.test(domain)) {
		return new Response(JSON.stringify({ success: false, message: "Domain không hợp lệ (Backend check)" }), { status: 400, headers: corsHeaders });
	}

      // [2] --- BẮT ĐẦU ĐOẠN MÃ MỚI: GỌI HÀM KIỂM TRA ---
      // Thực hiện kiểm tra kỹ trước khi chạy lệnh
      const validation = await validateCloudflareConnection(zoneId, token);
      
      if (!validation.ok) {
         // Nếu kiểm tra thất bại, trả về lỗi ngay lập tức
         return new Response(JSON.stringify({ 
             success: false, 
             message: validation.message 
         }), { status: 400, headers: corsHeaders });
      }
      // [2] --- KẾT THÚC ĐOẠN MÃ MỚI ---	
	  
    // 1. TẠO THỜI GIAN THỰC (Real-time)
    // Code này chạy mỗi lần request được gọi
    const currentTime = new Date().toLocaleString('sv-SE', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }); 
    // currentTime lúc này sẽ là: "2026-01-19 07:15" (Ví dụ)	  

      // Khi đã qua được cửa ải if ở trên, nghĩa là dữ liệu đã đầy đủ.
      // Gán trực tiếp giá trị thực, không dùng fallback ảo nữa.
      const targetDomain = domain;
      const targetIp = server_ip;

      const commonHeaders = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

// --------------------------------------------------------------------------------------------------------------------------------
      // --- EXECUTE UPDATES (CHẠY SONG SONG VỚI PROMISE.ALL) ---
      
      // Tạo danh sách các task cần chạy (chưa await vội)
	  // Sắp xếp thứ tự cho logic, tường lửa đầu tiên, cache cuối cùng
      const MY_WAF_RULES = get_MY_WAF_RULES(targetDomain, targetIp, currentTime); // tường lửa
	  const MY_RATE_LIMIT_RULES = get_MY_RATE_LIMIT_RULES(currentTime); // giới hạn số lần vào trang đăng nhập
	  const MY_TRANSFORM_RULES = get_MY_TRANSFORM_RULES(currentTime); // loại bỏ query tracking
	  const MY_CACHE_RULES = get_MY_CACHE_RULES(currentTime); // cache toàn trang	    
	  
	  // Tạo biến hằng số cho Base URL.
      const BASE_API = `https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases`;
	  
      const tasks = [
        // Task 1: Update Cache Rules
        fetch(`${BASE_API}/http_request_cache_settings/entrypoint`, {
          method: "PUT", headers: commonHeaders, body: JSON.stringify({ rules: MY_CACHE_RULES }),
		  signal: AbortSignal.timeout(10000)  // 10 giây
        }),
        // Task 2: Update Transform Rules
        fetch(`${BASE_API}/http_request_transform/entrypoint`, {
          method: "PUT", headers: commonHeaders, body: JSON.stringify({ rules: MY_TRANSFORM_RULES }),
		  signal: AbortSignal.timeout(10000)  // 10 giây
        }),
        // Task 3: Update WAF Custom Rules
        fetch(`${BASE_API}/http_request_firewall_custom/entrypoint`, {
          method: "PUT", headers: commonHeaders, body: JSON.stringify({ rules: MY_WAF_RULES }),
		  signal: AbortSignal.timeout(10000)  // 10 giây
        }),
        // Task 4: Update Rate Limiting
        fetch(`${BASE_API}/http_ratelimit/entrypoint`, {
          method: "PUT", headers: commonHeaders, body: JSON.stringify({ rules: MY_RATE_LIMIT_RULES }),
		  signal: AbortSignal.timeout(10000)  // 10 giây
        })
      ];

      // Bắt đầu chạy tất cả cùng lúc và chờ kết quả
      const responses = await Promise.all(tasks);

      // Lấy kết quả JSON
      const [cacheJson, transformJson, wafJson, rateLimitJson] = await Promise.all(
        responses.map(r => r.json())
      );

      // Hàm gom lỗi từ Cloudflare response
      const getErrors = (res) => res.success ? null : res.errors.map(e => e.message).join("; ");

      const errors = {
        cache: getErrors(cacheJson),
        transform: getErrors(transformJson),
        waf: getErrors(wafJson),
        rate_limit: getErrors(rateLimitJson)
      };

      // Chỉ thành công khi không có lỗi nào ở cả 4 task
      const success = !errors.cache && !errors.transform && !errors.waf && !errors.rate_limit;

      // [3] --- ĐOẠN ĐÃ SỬA LỖI TYPE (FIXED) ---
      let userFriendlyMessage = null; // Biến này chứa thông báo tiếng Việt cho người dùng

      if (!success) { // Nếu không thành công thì cần báo lỗi, chủ yếu là do thiếu quyền.
         // Chuyển object errors thành chuỗi để kiểm tra từ khóa
         const errorString = JSON.stringify(errors);
         
         // Gộp cứng thông báo: Lời khuyên về quyền hạn + Chi tiết lỗi kỹ thuật
         userFriendlyMessage = "❌ LỖI QUYỀN HẠN (Permissions):\n" +
             "Token và Zone ID đều ĐÚNG (đã qua bước kiểm tra), nhưng Token này có thể đang thiếu quyền 'Edit' (Ghi) cho mục nào đó.\n" +
             "=> Khả năng cao là do bạn đang để quyền 'Read' (Xem). \n\n" +
			 "Hãy cấp đủ quyền Edit cho cả 3 mục: Cache Rules, Transform Rules, WAF.\n\n" +
			 "Xem lại hướng dẫn Cách lấy Zone ID & Tạo API Token. \n\n" +
             "Chi tiết lỗi kỹ thuật từ Cloudflare:\n\n" + errorString;
      }

      return new Response(JSON.stringify({ 
          success, 
          // QUAN TRỌNG: Frontend sẽ đọc dòng 'message' này để hiện popup lỗi
          message: success ? "Thành công" : userFriendlyMessage, 
          
          details: { 
            cache: cacheJson.success, 
            transform: transformJson.success, 
            waf: wafJson.success, 
            rate_limit: rateLimitJson.success 
          },
          
          // SỬA Ở ĐÂY: Giữ nguyên object errors gốc (để debug) hoặc null. 
          // Không gán string vào đây nữa để tránh lỗi Type.
          errors: success ? null : errors 
      }), {
        status: success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
      // [3] --- KẾT THÚC ĐOẠN ĐÃ SỬA ---
// --------------------------------------------------------------------------------------------------------------------------------
    } catch (err) {
      return new Response(JSON.stringify({ success: false, message: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  },
};