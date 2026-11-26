/**
 * Cloudflare Worker 訂閱發布腳本
 * 功能：
 * 1. 驗證 Token 安全存取訂閱 YAML
 * 2. 支援動態查詢參數 ?ip=104.16.x.x，即時覆寫優選 IP，免改客戶端設定
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 安全 Token 路徑檢查
    if (!env.SUB_TOKEN || url.pathname !== "/" + env.SUB_TOKEN) {
      return new Response("Not Found", { status: 404 });
    }

    // 檢查訂閱內容是否已配置
    if (!env.SUB_YAML) {
      return new Response("Subscription not configured in Worker secrets", {
        status: 500,
      });
    }

    let yaml = env.SUB_YAML;

    // 支援動態查詢參數 ?ip=x.x.x.x 或 ?cfip=x.x.x.x
    const customIp = url.searchParams.get("ip") || url.searchParams.get("cfip");
    if (customIp && /^(\d{1,3}\.){3}\d{1,3}$/.test(customIp)) {
      // 動態將主節點 VULTR-CF-WS-CDN (或自定義名稱) 的 server 欄位即時替換
      yaml = yaml.replace(
        /(- name:\s*['"]?CF-WS-CDN['"]?[\s\S]*?\n\s+server:\s*)['"]?[^'"\r\n]+['"]?/,
        `$1${customIp}`
      );
    }

    return new Response(yaml, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="subscription.yaml"',
        "profile-update-interval": "24",
        "Cache-Control": "no-store",
      },
    });
  },
};
