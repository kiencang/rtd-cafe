/**
 * CLOUDFLARE WORKER: WORDPRESS OPTIMIZER & SECURITY
 * Chức năng: Tự động cấu hình Cache Rules, WAF, Transform Rules và Rate Limiting.
 * Phiên bản v1.0.13 (Có tích hợp Turnstile để chống lạm dụng worker)
 * Thuộc dự án: rtd-cafe
 * Link ứng dụng: https://rtd-cafe.wpsila.com (index.html & file css, js liên quan)
 * Link của worker.js: https://rtd-cafe-settings.wpsila.com/rtd-cafe-worker-api (chặn truy cập trực tiếp, chỉ gọi được qua ứng dụng)
 * Tác giả: wpsila - Nguyễn Đức Anh
 */

// +++

// =========================================================================
// 1. CẤU HÌNH CACHE RULES (6 RULES)
// Lưu ý ở trong expression, các dấu nháy " được bổ sung thành \" để không lỗi cú pháp.
// Cache ở phía Edge cho rule 1 có thể tăng thêm thành 3 ngày hoặc 1 tuần nếu có plugin xóa cache tự động.
// Cache phía trình duyệt cho html ở rule chỉ nên để trong khoảng từ 1 - 5 phút, không nên hơn.
// =========================================================================
const MY_CACHE_RULES = [
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
    "description": "Quy tắc 1: Quy tắc cache chung (HTML cache)", // Đặt tên cho quy tắc
    "enabled": true, // Bật tính năng này
    // Loại trừ các file tĩnh (để Rule 2,3 xử lý) và trang đăng nhập
    "expression": "(not http.request.uri.path contains \"/wp-login.php\" and not http.request.uri.path contains \"/wp-admin\" and not http.cookie contains \"wordpress_logged_in_\" and not http.request.uri.path.extension in {\"css\" \"js\" \"woff\" \"woff2\" \"ttf\" \"otf\" \"eot\" \"map\" \"jpg\" \"png\" \"jpeg\" \"webp\" \"avif\" \"ico\" \"svg\" \"gif\" \"pdf\" \"mp3\" \"mp4\" \"webm\"})"
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
    "description": "Quy tắc 2: Cache CSS, JS và font",
    "enabled": true,
    "expression": "(http.request.uri.path.extension in {\"css\" \"js\" \"woff\" \"woff2\" \"ttf\" \"otf\" \"eot\" \"map\"})"
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
    "description": "Quy tắc 3: Cache ảnh, PDF, media",
    "enabled": true,
    "expression": "(http.request.uri.path.extension in {\"jpg\" \"jpeg\" \"png\" \"ico\" \"svg\" \"gif\" \"webp\" \"avif\" \"pdf\" \"mp3\" \"mp4\" \"webm\"})"
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
    "description": "Quy tắc 4: Cache ngắn cho Sitemap & Feed",
    "enabled": true,
    "expression": "(http.request.uri.path contains \"sitemap\") or (http.request.uri.path contains \"/feed/\")"
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Rule 5: BYPASS CACHE (Quan trọng nhất - nằm gần cuối để ghi đè)
  // Danh sách này đặc biệt quan trọng để tránh cache lỗi. Tôn chỉ: Thà bỏ sót cache, còn hơn là cache nhầm.
  // Có thể cần bổ sung tùy theo trường hợp cụ thể của blog, hoặc có sự thay đổi của WordPress sau này (ít thường xuyên).
  {
    "action": "set_cache_settings",
    "action_parameters": { "cache": false },
    "description": "Quy tắc 5: Bỏ qua không cache (Admin, Login, API)",
    "enabled": true,
    "expression": "(http.request.uri.path contains \"/wp-admin\" and not http.request.uri.path.extension in {\"css\" \"js\" \"woff\" \"woff2\" \"ttf\" \"otf\" \"eot\"}) or (http.request.uri.path contains \"/wp-login.php\") or (http.request.uri.path contains \"/robots.txt\") or (http.request.uri.path contains \"/wp-json/\") or (http.request.uri.query contains \"rest_route=\") or (http.request.uri.path contains \"/xmlrpc.php\") or (http.request.uri.path contains \"/wp-cron.php\") or (http.request.uri.query contains \"doing_wp_cron=\") or (http.cookie contains \"wordpress_logged_in_\") or (http.cookie contains \"wp-postpass_\") or (http.cookie contains \"wordpress_sec_\") or (http.cookie contains \"comment_author_\") or (http.request.uri.query contains \"replytocom=\") or (http.request.uri.query contains \"unapproved=\") or (http.request.uri.query contains \"moderation-hash=\") or (http.request.uri.query contains \"preview=\") or (http.request.uri.query contains \"preview_id=\") or (http.request.uri.query contains \"preview_nonce=\") or (http.request.uri.query contains \"customize_changeset_uuid\") or (http.request.uri.query contains \"customize_preview=\") or (http.request.uri.query contains \"customize=\") or (http.request.uri.query contains \"_wpnonce\") or (http.request.uri.query contains \"s=\") or (http.request.uri.query contains \"action=\") or (http.request.uri.query contains \"elementor-preview\") or (http.request.uri.query contains \"fl_builder\") or (http.request.uri.query contains \"et_fb\") or (http.request.uri.query contains \"vc_editable\") or (http.request.uri.query contains \"bricks=\") or (http.request.uri.query contains \"tve=\") or (http.request.uri.query contains \"brizy-edit\") or (http.request.uri.path contains \"/wp-signup.php\") or (http.request.uri.path contains \"/wp-activate.php\") or (http.request.uri.path contains \"/wp-reset-password.php\") or (http.request.uri.query contains \"nocache\")"
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Rule 6: Cache cho trang Admin (CSS, JS, font)
  // Cải tiến này giúp trang admin tải nhanh hơn. CSS & JS của admin luôn có version đi kèm.
  // Tuy vậy để chắc chắn cũng không nên để thời gian cache quá lâu.
  {
    "action": "set_cache_settings",
    "action_parameters": {
      "cache": true,
      "edge_ttl": { "default": 604800, "mode": "override_origin" }, // 7 ngày
      "browser_ttl": { "default": 7200, "mode": "override_origin" } // 2 tiếng
    },
    "description": "Quy tắc 6: Cache cho trang Admin (chỉ CSS, JS và font)",
    "enabled": true,
    "expression": "(http.request.uri.path contains \"/wp-admin\" and http.request.uri.path.extension in {\"css\" \"js\" \"woff\" \"woff2\" \"ttf\" \"otf\" \"eot\"})"
  }
];
// --------------------------------------------------------------------------------------------------------------------------------

// +++

// --------------------------------------------------------------------------------------------------------------------------------
// =========================================================================
// 2. CẤU HÌNH TRANSFORM RULES (URL REWRITE)
// Đảm bảo vẫn duy trì được hiệu suất cao khi trang được chia sẻ trên các nền tảng mạng xã hội
// =========================================================================
const MY_TRANSFORM_RULES = [
  {
    "action": "rewrite",
    "action_parameters": { "uri": { "query": { "value": "" } } },
    "description": "Quy tắc 7: Xóa các query tracking phổ biến (fbclid, utm...)",
    "enabled": true,
    "expression": "(http.request.uri.query contains \"fbclid\") or (http.request.uri.query contains \"utm_\") or (http.request.uri.query contains \"gclid\") or (http.request.uri.query contains \"ttclid\") or (http.request.uri.query contains \"wbraid\") or (http.request.uri.query contains \"gbraid\") or (http.request.uri.query contains \"msclkid\") or (http.request.uri.query contains \"yclid\") or (http.request.uri.query contains \"mc_cid\") or (http.request.uri.query contains \"_hsenc\") or (http.request.uri.query contains \"dclid\")"
  }
];
// --------------------------------------------------------------------------------------------------------------------------------

// +++

// --------------------------------------------------------------------------------------------------------------------------------
// =========================================================================
// 3. CẤU HÌNH RATE LIMITING (GIỚI HẠN TỐC ĐỘ)
// Chống việc bị tấn công vào trang login của WordPress (wp-login.php)
// Có thể mở rộng thêm các trang khác bằng cú pháp OR trong khi điều chỉnh rule thủ công.
// =========================================================================
const MY_RATE_LIMIT_RULES = [
  {
    "action": "block",
    "ratelimit": {
      // QUAN TRỌNG: Gói Free bắt buộc phải có "cf.colo.id"
      "characteristics": ["cf.colo.id", "ip.src"], 
      "period": 10, // Trong 10 giây
      "requests_per_period": 5, // Tối đa 5 lần
      "mitigation_timeout": 10 // Chặn 10 giây
    },
    "description": "Giới hạn số lần vào trang đăng nhập",
    "enabled": true,
    "expression": "(http.request.uri.path contains \"/wp-login.php\")"
  }
];
// --------------------------------------------------------------------------------------------------------------------------------

// +++

// --------------------------------------------------------------------------------------------------------------------------------
// =========================================================================
// 4. HÀM TẠO WAF RULES (BẢO MẬT) - CẦN IP & DOMAIN
// =========================================================================
const getWafRules = (domain, vpsIP) => [
  // Bảo mật 1: Whitelist IP VPS
  // Rule quan trọng để tránh chặn chính mình khi bản thân WordPress thực thi một số tác vụ quay về chính VPS.
  {
    "action": "skip",
    "action_parameters": { "ruleset": "current" },
    "description": "Bảo mật 1: Không chặn chính mình (IP của VPS)",
    "enabled": true,
    "expression": `(ip.src eq ${vpsIP})` // Không có nháy kép ở đây, IP của VPS là số
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Bảo mật 2: Chặn file nhạy cảm
  // Một danh sách dài các file chứa thông tin quan trọng không được để lộ ra ngoài.
  {
    "action": "block",
    "description": "Bảo mật 2: Chặn truy cập các file nhạy cảm",
    "enabled": true,
	"expression": "(http.request.uri.path contains \"/xmlrpc.php\") or (http.request.uri.path contains \"/wp-config.php\") or (http.request.uri.path contains \".htaccess\") or (http.request.uri.path contains \"/.env\") or (http.request.uri.path contains \"/.git/\") or (http.request.uri.path contains \"/wp-includes/wlwmanifest.xml\") or (ends_with(http.request.uri.path, \".log\")) or (ends_with(http.request.uri.path, \".sql\")) or (ends_with(http.request.uri.path, \".bak\")) or (ends_with(http.request.uri.path, \".old\")) or (ends_with(http.request.uri.path, \"readme.html\")) or (ends_with(http.request.uri.path, \"license.txt\")) or (ends_with(http.request.uri.path, \".git\")) or (http.request.uri.path contains \"/wp-content/uploads/\" and http.request.uri.path contains \".php\")"
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Bảo mật 3: Bảo vệ Login & Admin
  // Thử thách bằng managed_challenge, một trong các giải pháp rất mạnh để hạn chế bot.
  {
    "action": "managed_challenge",
    "description": "Bảo mật 3: Hạn chế bot vào trang login và admin",
    "enabled": true,
    "expression": "(http.request.uri.path contains \"/wp-login.php\") or (http.request.uri.path contains \"/wp-admin\" and not http.request.uri.path contains \"/wp-admin/admin-ajax.php\" and not http.request.uri.path contains \"/wp-admin/css/\" and not http.request.uri.path contains \"/wp-admin/js/\" and not http.request.uri.path contains \"/wp-admin/images/\")"
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Bảo mật 4: Hạn chế Bot rác
  // Thử thách bằng managed_challenge
  // Điều kiện quan trọng là bot đó phải không thuộc nhóm bot lành tính trong danh sách cf.client.bot
  {
    "action": "managed_challenge",
    "description": "Bảo mật 4: Hạn chế bot rác",
    "enabled": true,
    "expression": "(http.user_agent eq \"\" and not cf.client.bot) or (http.user_agent contains \"go-http\" and not cf.client.bot) or (http.user_agent contains \"axios\" and not cf.client.bot) or (http.user_agent contains \"wpscan\" and not cf.client.bot) or (http.user_agent contains \"sqlmap\" and not cf.client.bot) or (http.user_agent contains \"nmap\" and not cf.client.bot) or (http.user_agent contains \"headless\" and not cf.client.bot) or (http.user_agent contains \"selenium\" and not cf.client.bot) or (http.request.method eq \"POST\" and http.referer eq \"\" and not cf.client.bot)"
  },
// --------------------------------------------------------------------------------------------------------------------------------  
  // Bảo mật 5: Hạn chế Spam Comment
  // Thử thách bằng managed_challenge
  {
    "action": "managed_challenge",
    "description": "Bảo mật 5: Hạn chế spam bình luận",
    "enabled": true,
    "expression": `(http.request.uri.path eq "/wp-comments-post.php" and http.request.method eq "POST" and not http.referer contains "${domain}")`
  }
];
// --------------------------------------------------------------------------------------------------------------------------------
// Đến đây là kết thúc phần logic cho các rule cần cài đặt.

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
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
	
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
      });

      const outcome = await turnstileResult.json();

      // Nếu Token turnstile sai hoặc hết hạn -> Chặn ngay
      if (!outcome.success) {
        return new Response(JSON.stringify({ success: false, message: "Xác thực Captcha thất bại. Vui lòng thử lại." }), { status: 403, headers: corsHeaders });
      }
      
      // =========================================================
      // TOKEN HỢP LỆ -> CHẠY LOGIC CHÍNH
      // =========================================================

      // Validate Input (xác thực đầu vào)
      if (!zoneId || !token) {
        return new Response(JSON.stringify({ success: false, message: "Thiếu Zone ID hoặc Token" }), { status: 400, headers: corsHeaders });
      }

      const targetDomain = domain || "yourdomain.com";
      const targetIp = server_ip || "1.1.1.1";

      const commonHeaders = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

// --------------------------------------------------------------------------------------------------------------------------------
      // --- EXECUTE UPDATES (CHẠY SONG SONG VỚI PROMISE.ALL) ---
      
      // Tạo danh sách các task cần chạy (chưa await vội)
      const wafRules = getWafRules(targetDomain, targetIp);
      
      const tasks = [
        // Task 1: Update Cache Rules
        fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_request_cache_settings/entrypoint`, {
          method: "PUT", headers: commonHeaders, body: JSON.stringify({ rules: MY_CACHE_RULES })
        }),
        // Task 2: Update Transform Rules
        fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_request_transform/entrypoint`, {
          method: "PUT", headers: commonHeaders, body: JSON.stringify({ rules: MY_TRANSFORM_RULES })
        }),
        // Task 3: Update WAF Custom Rules
        fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_request_firewall_custom/entrypoint`, {
          method: "PUT", headers: commonHeaders, body: JSON.stringify({ rules: wafRules })
        }),
        // Task 4: Update Rate Limiting
        fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_ratelimit/entrypoint`, {
          method: "PUT", headers: commonHeaders, body: JSON.stringify({ rules: MY_RATE_LIMIT_RULES })
        })
      ];

      // Bắt đầu chạy tất cả cùng lúc và chờ kết quả
      const responses = await Promise.all(tasks);

      // Lấy kết quả JSON từ các response
      const [cacheJson, transformJson, wafJson, rateLimitJson] = await Promise.all(
        responses.map(r => r.json())
      );
	  
	// --- PROCESS RESULTS (xử lý kết quả) ---           
      const results = {
        cache: cacheJson,
        transform: transformJson,
        waf: wafJson,
        rate_limit: rateLimitJson
      };

      // Check success: Phải thành công tất cả mới tính là thành công
      const success = results.cache.success && results.transform.success && results.waf.success && results.rate_limit.success;
// --------------------------------------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------------------------------------- 
      return new Response(JSON.stringify({ success, details: results }), {
        status: success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, message: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  },
};