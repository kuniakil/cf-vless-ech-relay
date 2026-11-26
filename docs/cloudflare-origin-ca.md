# Cloudflare Origin CA 15 年期憑證申請與部署指南

為了避免使用 ACME Let's Encrypt 自動續期可能發生的回源驗證失敗，推薦使用 Cloudflare 官方提供的免費 **15 年 Origin CA 憑證**。

---

## 方式一：在 Cloudflare 後台手動簽署（最簡單）

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 進入你的網域 ➜ 側邊欄點選 **SSL/TLS** ➜ **Origin Server**。
3. 點擊 **Create Certificate**（建立憑證）：
   - **Key type**：選擇 `RSA (2048)`。
   - **Hostnames**：預設會包含 `example.com` 與 `*.example.com`，確保包含你的子網域（如 `cdn.example.com`）。
   - **Certificate Validity**：選擇 `15 years`（15 年）。
4. 點擊 **Create**：
   - 複製 **Origin Certificate** 內容，在 VPS 上存為 `/etc/ssl/cf_origin.pem`。
   - 複製 **Private Key** 內容，在 VPS 上存為 `/etc/ssl/cf_origin.key`。
5. 在 VPS 上設定檔案權限：
   ```bash
   chmod 600 /etc/ssl/cf_origin.key
   chmod 644 /etc/ssl/cf_origin.pem
   ```

---

## 方式二：使用 Cloudflare API 自動化簽署（可交給 AI Agent 執行）

如果提供具備 `Zone:SSL and Certificates:Edit` 權限的 API Token，AI Agent 可於本地產生 CSR 並自動調用 API 完成簽署：

```bash
# 1. 在 VPS 本機生成私鑰與 CSR
openssl req -new -newkey rsa:2048 -nodes \
  -keyout /etc/ssl/cf_origin.key \
  -out /tmp/cf_origin.csr \
  -subj "/CN=cdn.example.com"

# 2. 調用 Cloudflare Origin CA API 簽發
curl -s -X POST "https://api.cloudflare.com/client/v4/certificates" \
  -H "Authorization: Bearer <YOUR_CF_API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "hostnames": ["cdn.example.com"],
    "requested_validity": 5475,
    "request_type": "origin-rsa",
    "csr": "'"$(cat /tmp/cf_origin.csr | tr -d '\n')"'"
  }' | jq -r '.result.certificate' > /etc/ssl/cf_origin.pem

# 3. 清理臨時 CSR
rm -f /tmp/cf_origin.csr
```
