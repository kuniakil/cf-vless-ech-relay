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

## 🚀 核心架構亮點

- **零侵入共存**：透過 Nginx Stream（`ssl_preread`）SNI 分流，與現有的 Reality、AnyTLS、Hysteria2 或 Web 站點完美共用 443 埠。
- **抗探測與隱蔽性**：隨機高熵 WebSocket 路徑，非指定請求一律回傳 404；啟用 **ECH（Encrypted Client Hello）**，阻絕中間人對 SNI 的明文嗅探。
- **免維護憑證**：採用 Cloudflare 官方 15 年 Origin CA 憑證，杜絕 Let's Encrypt 自動續期回源失敗的隱患。
- **跨平台優雅訂閱**：透過 Cloudflare Worker 實作訂閱發布，內建多節點優選池，並支援在訂閱 URL 帶入 `?ip=x.x.x.x` 即時覆寫，免去在客戶端編寫覆寫腳本的麻煩。

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
