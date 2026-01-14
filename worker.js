/**
 * CLOUDFLARE WORKER: WORDPRESS OPTIMIZER & SECURITY
 * Chức năng: Tự động cấu hình Cache Rules, WAF, Transform Rules và Rate Limiting.
 */

// =========================================================================
// CẤU HÌNH BẢO MẬT (QUAN TRỌNG)
// =========================================================================
// Để dấu "*" nếu bạn muốn test thử.
// Khi chạy chính thức, hãy thay bằng link trang HTML của bạn (VD: "https://tool-cua-ban.pages.dev")
// để chặn người khác dùng trộm Worker của bạn.
const ALLOWED_ORIGIN = "https://rtd-cafe.wpsila.com";


// =========================================================================
// 1. CẤU HÌNH CACHE RULES (5 RULES)
// =========================================================================
const MY_CACHE_RULES = [
  // Rule 1: Cache chung cho HTML (Bài viết, Trang chủ...)
  {
    "action": "set_cache_settings",
    "action_parameters": {
      "cache": true,
      "edge_ttl": { "default": 28800, "mode": "override_origin" }, // 8 tiếng, tính theo giây
      "browser_ttl": { "default": 7200, "mode": "override_origin" } // 2 tiếng
    },
    "description": "Quy tắc 1: Quy tắc cache chung",
    "enabled": true,
    // Loại trừ các file tĩnh (để Rule 2,3 xử lý) và trang đăng nhập
    "expression": "(not http.request.uri.path contains \"/wp-login.php\" and not http.request.uri.path contains \"/wp-admin\" and not http.cookie contains \"wordpress_logged_in_\" and not http.request.uri.path.extension in {\"css\" \"js\" \"woff\" \"woff2\" \"ttf\" \"otf\" \"eot\" \"map\" \"jpg\" \"png\" \"jpeg\" \"webp\" \"avif\" \"ico\" \"svg\" \"gif\" \"pdf\" \"mp3\" \"mp4\" \"webm\"})"
  },
  // Rule 2: Cache CSS, JS, Font
  {
    "action": "set_cache_settings",
    "action_parameters": {
      "cache": true,
      "edge_ttl": { "default": 2592000, "mode": "override_origin" }, // 1 tháng
      "browser_ttl": { "default": 28800, "mode": "override_origin" } // 8 tiếng
    },
    "description": "Quy tắc 2: Cache CSS, JS và font",
    "enabled": true,
    "expression": "(http.request.uri.path.extension in {\"css\" \"js\" \"woff\" \"woff2\" \"ttf\" \"otf\" \"eot\" \"map\"})"
  },
  // Rule 3: Cache Media (Ảnh, Video, PDF)
  {
    "action": "set_cache_settings",
    "action_parameters": {
      "cache": true,
      "edge_ttl": { "default": 31536000, "mode": "override_origin" }, // 1 năm
      "browser_ttl": { "default": 2592000, "mode": "override_origin" } // 1 tháng
    },
    "description": "Quy tắc 3: Cache ảnh, pdf, media",
    "enabled": true,
    "expression": "(http.request.uri.path.extension in {\"jpg\" \"png\" \"jpeg\" \"webp\" \"avif\" \"ico\" \"svg\" \"gif\" \"pdf\" \"mp3\" \"mp4\" \"webm\"})"
  },
  // Rule 4: Cache ngắn cho Sitemap & Feed
  {
    "action": "set_cache_settings",
    "action_parameters": {
      "cache": true,
      "edge_ttl": { "default": 28800, "mode": "override_origin" }, // 8 tiếng
      "browser_ttl": { "default": 28800, "mode": "override_origin" }
    },
    "description": "Quy tắc 4: Cache ngắn cho sitemap & feed",
    "enabled": true,
    "expression": "(http.request.uri.path contains \"sitemap\") or (http.request.uri.path contains \"/feed/\")"
  },
  // Rule 5: BYPASS CACHE (Quan trọng nhất - nằm cuối để ghi đè)
  {
    "action": "set_cache_settings",
    "action_parameters": { "cache": false },
    "description": "Quy tắc 5: Bỏ qua không cache (Admin, Login, API)",
    "enabled": true,
    "expression": "(http.request.uri.path contains \"/wp-admin\") or (http.request.uri.path contains \"/wp-login.php\") or (http.request.uri.path contains \"/robots.txt\") or (http.request.uri.path contains \"/wp-json/\") or (http.request.uri.query contains \"rest_route=\") or (http.request.uri.path contains \"/xmlrpc.php\") or (http.request.uri.path contains \"/wp-cron.php\") or (http.request.uri.query contains \"doing_wp_cron=\") or (http.cookie contains \"wordpress_logged_in_\") or (http.cookie contains \"wp-postpass_\") or (http.cookie contains \"wordpress_sec_\") or (http.cookie contains \"comment_author_\") or (http.request.uri.query contains \"replytocom=\") or (http.request.uri.query contains \"unapproved=\") or (http.request.uri.query contains \"moderation-hash=\") or (http.request.uri.query contains \"preview=\") or (http.request.uri.query contains \"preview_id=\") or (http.request.uri.query contains \"preview_nonce=\") or (http.request.uri.query contains \"customize_changeset_uuid\") or (http.request.uri.query contains \"customize_preview=\") or (http.request.uri.query contains \"customize=\") or (http.request.uri.query contains \"_wpnonce\") or (http.request.uri.query contains \"s=\") or (http.request.uri.query contains \"action=\") or (http.request.uri.query contains \"elementor-preview\") or (http.request.uri.query contains \"fl_builder\") or (http.request.uri.query contains \"et_fb\") or (http.request.uri.query contains \"vc_editable\") or (http.request.uri.query contains \"bricks=\") or (http.request.uri.query contains \"tve=\") or (http.request.uri.query contains \"brizy-edit\")"
  }
];

// =========================================================================
// 2. CẤU HÌNH TRANSFORM RULES (URL REWRITE)
// =========================================================================
const MY_TRANSFORM_RULES = [
  {
    "action": "rewrite",
    "action_parameters": { "uri": { "query": { "value": "" } } },
    "description": "Quy tắc 6: Xóa tất cả query tracking (fbclid, utm...)",
    "enabled": true,
    "expression": "(http.request.uri.query contains \"fbclid\") or (http.request.uri.query contains \"utm_\") or (http.request.uri.query contains \"gclid\") or (http.request.uri.query contains \"ttclid\") or (http.request.uri.query contains \"wbraid\") or (http.request.uri.query contains \"gbraid\") or (http.request.uri.query contains \"msclkid\") or (http.request.uri.query contains \"yclid\") or (http.request.uri.query contains \"mc_cid\") or (http.request.uri.query contains \"_hsenc\") or (http.request.uri.query contains \"dclid\")"
  }
];

// =========================================================================
// 3. CẤU HÌNH RATE LIMITING (GIỚI HẠN TỐC ĐỘ)
// =========================================================================
const MY_RATE_LIMIT_RULES = [
  {
    "action": "block",
    "ratelimit": {
      // QUAN TRỌNG: Gói Free bắt buộc phải có "cf.colo.id"
      "characteristics": ["cf.colo.id", "ip.src"], 
      "period": 10,            // Trong 10 giây
      "requests_per_period": 3, // Tối đa 3 lần
      "mitigation_timeout": 10  // Chặn 10 giây
    },
    "description": "Giới hạn số lần vào trang đăng nhập",
    "enabled": true,
    "expression": "(http.request.uri.path contains \"/wp-login.php\")"
  }
];

// =========================================================================
// 4. HÀM TẠO WAF RULES (BẢO MẬT) - CẦN IP & DOMAIN
// =========================================================================
const getWafRules = (domain, vpsIp) => [
  // Bảo mật 1: Whitelist IP VPS
  {
    "action": "skip",
    "action_parameters": { "ruleset": "current" },
    "description": "Bảo mật 1: Không chặn chính mình (VPS IP)",
    "enabled": true,
    "expression": `(ip.src eq ${vpsIp})`
  },
  // Bảo mật 2: Chặn file nhạy cảm
  {
    "action": "block",
    "description": "Bảo mật 2: Chặn truy cập các file nhạy cảm",
    "enabled": true,
    "expression": "(http.request.uri.path contains \"/xmlrpc.php\") or (http.request.uri.path contains \"/wp-config.php\") or (http.request.uri.path contains \".htaccess\") or (http.request.uri.path contains \"/.env\") or (http.request.uri.path contains \"/.git/\") or (http.request.uri.path contains \"/wp-includes/wlwmanifest.xml\") or (ends_with(http.request.uri.path, \".log\")) or (ends_with(http.request.uri.path, \".sql\")) or (ends_with(http.request.uri.path, \".bak\")) or (ends_with(http.request.uri.path, \".old\")) or (ends_with(http.request.uri.path, \"readme.html\")) or (ends_with(http.request.uri.path, \"license.txt\")) or (ends_with(http.request.uri.path, \".git\") or (http.request.uri.path contains \"/wp-content/uploads/\" and http.request.uri.path contains \".php\"))"
  },
  // Bảo mật 3: Bảo vệ Login & Admin
  {
    "action": "managed_challenge",
    "description": "Bảo mật 3: Hạn chế bot vào trang login và admin",
    "enabled": true,
    "expression": "(http.request.uri.path contains \"/wp-login.php\") or (http.request.uri.path contains \"/wp-admin\" and not http.request.uri.path contains \"/wp-admin/admin-ajax.php\" and not http.request.uri.path contains \"/wp-admin/css/\" and not http.request.uri.path contains \"/wp-admin/js/\" and not http.request.uri.path contains \"/wp-admin/images/\")"
  },
  // Bảo mật 4: Chặn Bot rác
  {
    "action": "managed_challenge",
    "description": "Bảo mật 4: Hạn chế bot rác",
    "enabled": true,
    "expression": "(http.user_agent eq \"\") or (http.user_agent contains \"go-http\") or (http.user_agent contains \"axios\") or (http.user_agent contains \"wpscan\") or (http.user_agent contains \"sqlmap\") or (http.user_agent contains \"nmap\") or (http.user_agent contains \"headless\") or (http.user_agent contains \"selenium\") or (http.request.method eq \"POST\" and http.referer eq \"\" and not cf.client.bot)"
  },
  // Bảo mật 5: Chặn Spam Comment
  {
    "action": "managed_challenge",
    "description": "Bảo mật 5: Hạn chế spam bình luận",
    "enabled": true,
    "expression": `(http.request.uri.path eq "/wp-comments-post.php" and http.request.method eq "POST" and not http.referer contains "${domain}")`
  }
];

// =========================================================================
// 5. MAIN LOGIC (WORKER API)
// =========================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    
    // 2. Health Check
    if (request.method === "GET") return new Response("✅ Worker hoạt động tốt!", { status: 200, headers: corsHeaders });
    
    // 3. Method Check
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

    try {
      const { zoneId, token, domain, server_ip } = await request.json();

      // Validate Input
      if (!zoneId || !token) {
        return new Response(JSON.stringify({ success: false, message: "Thiếu Zone ID hoặc Token" }), { status: 400, headers: corsHeaders });
      }

      const targetDomain = domain || "yourdomain.com";
      const targetIp = server_ip || "1.1.1.1";

      const commonHeaders = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      // --- EXECUTE UPDATES ---

      // Task 1: Update Cache Rules
      const cacheRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_request_cache_settings/entrypoint`, {
        method: "PUT", headers: commonHeaders, body: JSON.stringify({ rules: MY_CACHE_RULES })
      });

      // Task 2: Update Transform Rules
      const transformRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_request_transform/entrypoint`, {
        method: "PUT", headers: commonHeaders, body: JSON.stringify({ rules: MY_TRANSFORM_RULES })
      });

      // Task 3: Update WAF Custom Rules
      const wafRules = getWafRules(targetDomain, targetIp);
      const wafRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_request_firewall_custom/entrypoint`, {
        method: "PUT", headers: commonHeaders, body: JSON.stringify({ rules: wafRules })
      });

      // Task 4: Update Rate Limiting
      const rateLimitRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_ratelimit/entrypoint`, {
        method: "PUT", headers: commonHeaders, body: JSON.stringify({ rules: MY_RATE_LIMIT_RULES })
      });

      // --- PROCESS RESULTS ---
      
      const results = {
        cache: await cacheRes.json(),
        transform: await transformRes.json(),
        waf: await wafRes.json(),
        rate_limit: await rateLimitRes.json()
      };

      // Check success
      const success = results.cache.success && results.transform.success && results.waf.success && results.rate_limit.success;
      
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