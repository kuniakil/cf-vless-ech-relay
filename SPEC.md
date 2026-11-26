# 技術實作規格書（Technical Specification）：CF CDN + VLESS-WS + ECH 備援線路

本規格書專為 **AI Coding Agent** 撰寫，定義了在 Linux VPS 上無痛新增 Cloudflare CDN 備援加速線路的架構邊界、安全原則與實作標準。

---

## 1. 架構定位與拓撲

本線路定位為**「晚高峰跨海海纜出口壅塞時的備援加速線路」**。利用 Cloudflare 全球 Anycast 節點作為邊緣入口，搭配優選 IP 與 ECH（Encrypted Client Hello），實現抗丟包、防 SNI 明文探測與源站 IP 隱匿。

### 1.1 流量拓撲圖

```text
[客戶端: Clash Verge Rev / FlClash / Shadowrocket]
   │  (連線至本地測速篩出的 CF 優選 Anycast IP:443)
   │  (SNI 與 Host 填入專用橘雲子網域，啟用 ECH 加密 Client Hello)
   ▼
[Cloudflare Edge Anycast 節點]
   │  (終結客戶端 TLS 1.3 + ECH，透過 CF 全球骨幹回源)
   │  (回源目標：VPS IP:443，Full Strict 驗證源站憑證)
   ▼
[VPS: Nginx 443 入口]
   │  (情境 A: Nginx Stream ssl_preread 依 SNI 分流)
   │  (情境 B: Nginx 直迎 443 埠)
   ▼
[VPS: Nginx 本地反代與 TLS 終結 (如 127.0.0.1:8446)]
   │  (載入 Cloudflare 15 年 Origin CA 憑證，終結回源 TLS)
   │  (路徑檢查：僅匹配隨機生成的特定路徑，其餘存取回傳 404)
   ▼  (轉發明文 HTTP/1.1 Upgrade WebSocket)
[VPS: sing-box VLESS Inbound (127.0.0.1:9445)]
   │  (純明文 VLESS+WS，無 TLS、無 Flow，監聽高位埠)
   ▼
[Direct 網際網路出口]
```

---

## 2. 核心架構原則（AI Agent 必守規範）

1. **職責分離（TLS 歸 Nginx，協議歸 sing-box / Xray）**：
   - `sing-box` 或 `Xray` 的 VLESS inbound **禁止配置 `tls` 區塊**，亦**嚴禁開啟 `flow`**（如 `xtls-rprx-vision`）。
   - 回源 TLS 握手由 `Nginx` 統一終結，核心核心程式僅於本地回環介面（`127.0.0.1`）處理明文 WebSocket 轉發。
2. **網域隔離（橘雲與灰雲互不干擾）**：
   - 直連協議（如 Reality、Hysteria2、AnyTLS）使用的網域必須保持灰雲（DNS Only）。
   - 本方案必須使用獨立的二級或三級子網域（如 `cdn.example.com`），並在 Cloudflare 開啟橘雲（Proxied）。
3. **憑證生命週期解耦（優先推薦 Origin CA）**：
   - 推薦在 Cloudflare 官方後台簽發 15 年有效期的 **Cloudflare Origin CA Certificate**，部署於 VPS 供 Nginx 載入。
   - 避免使用 Let's Encrypt 自動續期，防止因回源驗證問題造成憑證過期斷連。
4. **路徑偽裝與防探測（Concealment）**：
   - WebSocket 必須使用高熵隨機路徑（如 `/cfws_[16位隨機字元]`）。
   - 任何非 WebSocket Upgrade 請求或訪問根目錄 `/`，Nginx 必須直接回傳 `404 Not Found`。

---

## 3. 模組一：Cloudflare 側規格

AI Agent 需引導使用者或透過 API 驗證以下項目：
* **DNS 紀錄**：專用子網域 `A` / `AAAA` 指向 VPS IP，`Proxy status` 設為 **Proxied（橘雲）**。
* **SSL/TLS 加密模式**：必須設定為 **Full (Strict)**。
* **Edge 網路功能**：
  * **WebSockets**：`On`（開啟）。
  * **TLS 1.3**：`On`（開啟）。
  * **ECH (Encrypted Client Hello)**：`On`（開啟後 Cloudflare Edge 會在 HTTPS DNS 紀錄發布公鑰）。
* **憑證**：於 SSL/TLS -> Origin Server 簽署 15 年 Origin Certificate（覆蓋該子網域），部署私鑰與憑證至 VPS `/etc/ssl/`。

---

## 4. 模組二：VPS 服務端實作規格

### 4.1 443 埠分流判定
* **獨立主機（無其他 443 佔用）**：
  Nginx 直接監聽 `443 ssl`，載入 Origin CA 憑證。
* **共存主機（已有 Nginx Stream SNI 分流，如 Reality / AnyTLS）**：
  - 在 `stream.map $ssl_preread_server_name` 新增一條 mapping，將專用子網域導向本機高位埠（如 `127.0.0.1:8446`）。
  - Nginx 在 `http` 區塊監聽 `127.0.0.1:8446 ssl`，處理 TLS 終結。

### 4.2 Nginx 終結與反代配置規格
```nginx
server {
    listen 127.0.0.1:8446 ssl;
    http2 on;
    server_name cdn.example.com;

    ssl_certificate     /etc/ssl/cf_origin.pem;
    ssl_certificate_key /etc/ssl/cf_origin.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location /<隨機路徑> {
        if ($http_upgrade != "websocket") {
            return 404;
        }
        proxy_pass http://127.0.0.1:<SINGBOX_PORT>;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location / {
        return 404;
    }
}
```

### 4.3 核心服務端 Inbound 配置規格（sing-box 或 Xray 二選一）

#### 選項 A：sing-box Inbound 規格
```json
{
  "type": "vless",
  "tag": "vless-ws-cf-in",
  "listen": "127.0.0.1",
  "listen_port": 9445,
  "users": [
    {
      "name": "default-user",
      "uuid": "<隨機UUID>"
    }
  ],
  "transport": {
    "type": "ws",
    "path": "/<與Nginx一致的隨機路徑>"
  }
}
```

#### 選項 B：Xray Inbound 規格
```json
{
  "tag": "vless-ws-cf-in",
  "listen": "127.0.0.1",
  "port": 9445,
  "protocol": "vless",
  "settings": {
    "clients": [
      {
        "id": "<隨機UUID>",
        "level": 0
      }
    ],
    "decryption": "none"
  },
  "streamSettings": {
    "network": "ws",
    "security": "none",
    "wsSettings": {
      "path": "/<與Nginx一致的隨機路徑>"
    }
  }
}
```

---

## 5. 模組三：訂閱端（Cloudflare Worker）規格

為了擺脫各設備客戶端維護覆寫腳本的負擔，將訂閱發布託管於 Cloudflare Worker：

1. **預設多節點池展開**：
   - 預設提供 2~3 組主流優選 IP 節點（如企業優選段 `104.16.x.x`、亞太香港骨幹段 `162.159.x.x`、官方預設段）。
2. **動態 URL 參數注入（`?ip=`）**：
   - Worker 接收到請求時，檢查 `url.searchParams.get("ip")`。
   - 若帶有合法 IP，動態將主節點的 `server` 替換為該 IP 後回傳 YAML。
3. **DNS ECH 解析防護**：
   - 在訂閱檔的 `dns.nameserver-policy` 加入專用子網域走公共 DoH（`1.1.1.1`），確保客戶端能查詢到 Type 65 HTTPS 紀錄獲得 ECH 公鑰。

---

## 6. 驗收核驗清單（Acceptance Checklist）

- [ ] **既有服務不受影響**：VPS 原有端口連線、直連節點與網站服務運作正常。
- [ ] **DNS 與 ECH 解析生效**：`dig +short A <子網域>` 回傳 Cloudflare Anycast IP，且 `dig +short HTTPS <子網域>` 可見 `ech=` 公鑰。
- [ ] **路徑隱蔽生效**：`curl -kI https://<子網域>/` 回傳 HTTP 404。
- [ ] **WebSocket 握手正常**：發起 WS Upgrade 請求回傳 `HTTP/1.1 101 Switching Protocols`。
- [ ] **客戶端動態注入有效**：造訪 `https://<訂閱網址>?ip=1.2.3.4`，回傳 YAML 之節點 `server` 即時呈現 `1.2.3.4`。
