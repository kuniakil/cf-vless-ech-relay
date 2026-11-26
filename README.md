# cf-vless-ech-relay

> **Agent-Native Cloudflare CDN + VLESS-WS + ECH 備援加速線路**  
> *拒絕黑盒腳本。專為 AI Coding Agent 設計的非侵入式規格書與開源模板。*

---

## 💡 為什麼要有這個專案？

### 1. 拒絕「黑盒腳本」與面板的信任危機
市面上常見的科學上網教程多採用「一鍵安裝腳本（`curl ... | bash`）」或重型 Web 面板。這對使用者極其危險：
- 你無法確認外來的腳本是否夾帶後門、挖礦或未公開的二進位程式。
- 腳本經常暴力覆寫系統的 Nginx 或網路設定，破壞 VPS 上原有的既有服務與網站。

### 2. AI 時代的新範式（Agent-Native）
本專案**不提供任何安裝腳本**，而是提供：
1. **嚴謹的技術實作規格書（`SPEC.md`）**：清楚定義系統邊界、零中斷原則、TLS 終結權限與安全驗收標準。
2. **AI Agent 專用提示詞（`PROMPT.md`）**：你只需將這段提示詞交給你的 AI Coding Agent（如 Antigravity, Claude Code, Cursor, Cline 等）。

**AI Agent 會先檢查你的伺服器現況、審核設定檔安全性、向你提出計畫並徵得同意，最後精準地將備援線路「無損嵌入」你的系統中。**

---

## 📋 前置準備需求（Requirements）

在開始之前，請確認你具備以下條件：
1. **一台 Linux VPS**：
   - Debian 11+ / Ubuntu 20.04+。
   - 已安裝 **Nginx**（需具備 HTTP 與 Stream 模組）。
   - 已安裝 **sing-box** 或 **Xray-core** 其中之一。
2. **一個 Cloudflare 帳號**：
   - 免費方案即可，不需要任何付費功能。
3. **一個託管在 Cloudflare 的域名（強烈建議使用「免心疼」網域）**：
   - ⚠️ **強烈建議**：不要使用你綁定了重要工作或個人生產服務的主網域！
   - 💡 **最佳實踐**：可以到各大免費動態 DNS 註冊商申請二級網域（例如 `eu.org`、`us.kg`、`dedyn.io`、`duckdns.org` 等），或是花 1~2 美元購買廉價的免洗網域（如 `.xyz` / `.top` / `.cfd`），將其 NS 委派託管至 Cloudflare。
   - **優點**：即使該子網域未來遇到極端情況被封鎖或干擾，直接換一個二級網域即可，完全不傷及本尊網域。
4. **Cloudflare Worker 權限**：
   - 用於發布訂閱檔，免費帳號每日 100,000 次請求額度已綽綽有餘。

---

## 🚀 核心架構亮點

- **零侵入共存**：透過 Nginx Stream（`ssl_preread`）SNI 分流，與現有的 Reality、AnyTLS、Hysteria2 或 Web 站點完美共用 443 埠。
- **抗探測與隱蔽性**：隨機高熵 WebSocket 路徑，非指定請求一律回傳 404；啟用 **ECH（Encrypted Client Hello）**，阻絕中間人對 SNI 的明文嗅探。
- **免維護憑證**：採用 Cloudflare 官方 15 年 Origin CA 憑證，杜絕 Let's Encrypt 自動續期回源失敗的隱患。
- **Worker 級跨平台優雅訂閱（免客戶端寫腳本）**：
  - 訂閱由 Cloudflare Worker 發布，**預設展開多節點優選池**（涵蓋企業優選段、亞太香港骨幹段、官方預設段）。
  - **極速動態換 IP**：利用本地測速工具（如 `CloudflareSpeedTest`）測出新優選 IP 後，**只要在訂閱 URL 後方帶上 `?ip=x.x.x.x`**（例如 `https://sub.yourdomain.com/<TOKEN>?ip=104.16.88.99`），Worker 就會在記憶體中即時將節點 IP 覆寫回傳！手機、平板、電腦只要點擊「更新訂閱」就能立刻同步最新優選 IP，完全不需在客戶端手動修改或編寫覆寫腳本。

---

## 🛠️ 如何開始使用？

你不需要在終端機敲任何部署指令，只需兩步：

### 第一步：在 Cloudflare 準備網域
1. 新增一個專用子網域（如 `cdn.yourdomain.com`），指向你的 VPS IP，**開啟橘雲（Proxied）**。
2. 在 Cloudflare SSL/TLS 設定中將加密模式設為 **Full (Strict)**，並確認已開啟 **WebSockets**、**TLS 1.3** 與 **ECH**。
3. 參考 [`docs/cloudflare-origin-ca.md`](docs/cloudflare-origin-ca.md) 簽發一張免費的 15 年 Origin CA 憑證。

### 第二步：把任務交給你的 AI Coding Agent
打開你的 AI Agent 工具，複製專案中的 [**`PROMPT.md`**](PROMPT.md) 內容並發送給它：

```text
你好！請閱讀本專案倉庫（cf-vless-ech-relay）中的 SPEC.md 技術實作規格書。
我希望在我的 VPS 上新增這條「Cloudflare CDN + VLESS-WS + ECH」備援加速線路。
... (完整內容請見 PROMPT.md)
```

AI Agent 將會：
1. 唯讀檢視你的 VPS，分析目前的 443 埠分流結構。
2. 根據現狀提出具體的修改 diff 給你審查確認。
3. 執行備份、配置檔案寫入、語法測試（`nginx -t` / `sing-box check`）並平滑生效。
4. 交付訂閱設定檔與驗收測試報告。

### 第三步：取得訂閱與優選 IP 動態更新使用法

AI Agent 部署完成後，會為你產生 Cloudflare Worker 的訂閱 URL：

1. **日常懶人使用（開箱即測）**：
   - 直接將訂閱 URL（`https://sub.yourdomain.com/<TOKEN>`）匯入 Clash Verge Rev、FlClash、Shadowrocket 等客戶端。
   - 訂閱內建三組不同路由特性的優選節點池：
     - `CF-WS-CDN`（預設企業級優選 Anycast 段）
     - `CF-WS-CDN-HKG`（香港/亞太優選骨幹段，晚高峰防塞車）
     - `CF-WS-CDN-ANYCAST`（官方預設 Anycast 邊緣）
   - 在客戶端按閃電圖示測速，挑當下延遲最低的節點連線即可。

2. **進階極客使用（本地極速優選 IP 動態注入）**：
   - 當晚高峰感覺出口不順時，使用開源工具 [CloudflareSpeedTest](https://github.com/XIU2/CloudflareSpeedTest) 在本地寬頻測出當下最快 IP（例如 `104.16.88.99`）。
   - **完全不需要改動伺服器或客戶端腳本**，只要在你的客戶端訂閱網址後方加上參數：
     ```text
     https://sub.yourdomain.com/<TOKEN>?ip=104.16.88.99
     ```
   - 點擊「更新訂閱」，Worker 就會自動將節點 IP 動態替換成該 IP。全家所有設備（Mac、Windows、iPhone、Android）只要改 URL 參數就能同步生效！

---

## 📂 目錄結構

```text
cf-vless-ech-relay/
├── README.md               # 專案總覽與使用理念
├── PROMPT.md               # 複製給 AI Agent 的引導提示詞
├── SPEC.md                 # 核心：AI Agent 遵循的技術實作規格書
├── templates/
│   ├── nginx/
│   │   ├── cf-ws-backend.conf      # TLS 終結與 WS 反向代理模板
│   │   └── sni-stream-snippet.conf  # Nginx Stream 443 SNI 分流片段
│   ├── sing-box/
│   │   └── inbound-vless-ws.json    # sing-box VLESS-WS inbound 片段
│   ├── xray/
│   │   └── inbound-vless-ws.json    # Xray-core VLESS-WS inbound 片段
│   └── worker/
│       ├── worker.js               # 支援 ?ip= 動態參數的訂閱發布 Worker
│       └── wrangler.toml           # Wrangler 部署參考
└── docs/
    └── cloudflare-origin-ca.md     # 15 年 Origin CA 憑證取得指南
```

---

## ⚖️ 免責與邊界聲明

- 本專案定位為**晚高峰國際跨海出口壅塞時的備援加速線路**。
- 請遵守 Cloudflare 服務條款（Terms of Service），切勿將此架構用於超大規模非 Web 下載或違反當地法律之用途。
- 本專案遵循 MIT License 開源。
