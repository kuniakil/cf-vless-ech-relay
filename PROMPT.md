# AI Agent 部署提示詞（Prompt for AI Coding Agent）

> **使用說明**：  
> 將本檔案整段文字複製，貼給你的 AI Coding Agent（如 Antigravity、Claude Code、Cursor、Cline、Aider 等），並填入你自己的網域與 VPS 連線資訊。  
> 你的 AI Agent 將會以「零黑盒、透明檢查、零破壞」的原則，為你的伺服器量身打造並部署這條備援線路。

---

```markdown
你好！請閱讀本專案倉庫（cf-vless-ech-relay）中的 `SPEC.md` 技術實作規格書。
我希望在我的 VPS 上新增這條「Cloudflare CDN + VLESS-WS + ECH」備援加速線路。

### 📋 執行原則與硬性約束（Guardrails）：
1. **禁止盲目執行一鍵腳本**：
   - 嚴禁下載或執行任何未經審查的黑盒二進位檔案或網路腳本。
   - 所有設定變更必須直接針對原生設定檔（Nginx、sing-box），並保持最小侵入性。
2. **零中斷原則（Non-Intrusive）**：
   - 修改任何既有檔案前，必須先建立備份。
   - 先以唯讀方式檢查我伺服器目前的 443 埠與網路監聽狀態（例如是否有既有網站、Reality、Hysteria2 或反向代理），絕對不可覆蓋或破壞既有服務。
3. **安全審核與確認制（Plan-First）**：
   - 根據 `SPEC.md` 與我的伺服器現況，提出具體的設定修改計畫與 diff 差異比對，取得我的確認批准後方可執行。
   - 每次套用設定前，必須先通過語法檢查（`nginx -t`、`sing-box check`），確認無誤後才平滑重載（reload）。
4. **路徑隱蔽與防探測**：
   - 隨機生成複雜的 WebSocket 路徑與 UUID。
   - 確保非指定路徑的直接 HTTP 請求一律回傳 404 Not Found。

### 🌐 我的環境參數（請在此填入或引導我確認）：
- VPS 連線方式：[例如 ssh user@your-vps-ip]
- 專用子網域（已在 Cloudflare 託管並開啟橘雲 Proxied）：[例如 cdn.example.com]
- SSL 模式：請引導我或使用 Cloudflare API 確認已開啟 Full (Strict)、TLS 1.3、WebSockets 與 ECH。
- Cloudflare Origin CA 憑證：[已簽發或請引導我簽發]

請先執行第一步：對我的伺服器進行唯讀檢查，並回報目前的網路拓撲與建議方案。
```
