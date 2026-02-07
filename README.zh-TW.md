# 🖥 網站監控系統

> **[📖 English Documentation](./README.md)**

基於全棧 TypeScript（NestJS + Vue 3）和 Docker 容器化技術的輕量級網站監控系統，支援使用者認證與角色權限、多群組域名管理、多協定監控、Telegram 告警通知、操作紀錄審計、批量編輯。

## 功能總覽

| 功能 | 說明 |
| :--- | :--- |
| **使用者認證** | JWT 登入機制，預設 admin 帳號（admin/admin） |
| **角色權限控制** | 4 種角色：`admin`（完全存取）、`allread`（讀取全部）、`onlyedit`（編輯指派群組）、`onlyread`（讀取指派群組） |
| **修改密碼** | 所有使用者可改自己密碼；admin 可改任何使用者密碼 |
| **操作紀錄** | 所有操作（登入、CRUD、改密碼）皆記錄；admin 查看全部日誌，使用者查看自己 |
| **HTTP 監控** | 檢查目標域名的 HTTP 連線狀態碼 |
| **HTTPS 監控** | 檢查 HTTPS 連線狀態碼（勾選 HTTPS 自動啟用 TLS 檢查） |
| **TLS 證書檢查** | 連線 443 埠，檢查 SSL 證書剩餘天數 |
| **WHOIS 域名到期** | 查詢域名 WHOIS 資訊，計算註冊到期剩餘天數 |
| **多群組域名** | 一個域名可同時屬於多個群組（多對多關聯） |
| **域名搜尋** | 搜尋欄位即時過濾目前選定群組內的域名 |
| **批量編輯** | 勾選多個域名，一次修改監控項目設定 |
| **獨立監控開關** | 每個域名可獨立啟用/關閉 HTTP、HTTPS、TLS、WHOIS 四項監控 |
| **域名重複防護** | 新增或批量匯入時，自動擋掉已存在的域名 |
| **JSON 批量匯入** | 透過 JSON 格式一次匯入多個域名，支援群組指派 |
| **Telegram 告警** | TLS/域名到期或 HTTP 連續失敗時，自動發送 Telegram 通知；設定存入 DB |
| **失敗計數告警** | HTTP/HTTPS 連續失敗達到設定次數後才觸發告警（可自訂） |
| **獨立檢查間隔** | HTTP/HTTPS 按秒設定（最低 60s），TLS/WHOIS 按天設定（最低 1 天） |
| **批量分批處理** | 檢查時每 5 個域名一批，批次間延遲 2 秒，避免瞬間大量請求 |
| **彈性檢查歷史** | 可選時間範圍查看檢查結果：1h / 12h / 24h / 1d / 7d / 14d |
| **告警設定頁面** | 在網頁上設定 TG Bot Token、Chat ID、告警天數門檻（存入 DB） |
| **自動排程** | 每分鐘執行排程，依各域名獨立間隔決定是否到期需檢查 |
| **暫停/啟動** | 可單獨暫停或啟動任何域名的監控 |
| **紀錄保留管理** | admin 可設定操作紀錄和監控紀錄的保留天數，打勾啟用後每日排程自動清理過期資料 |
| **獨立頁面** | 儀表板、使用者管理、操作紀錄、Telegram 設定、系統設定 各為獨立頁面，透過導航列切換 |
| **資料持久化** | 所有資料存入 PostgreSQL，Docker named volume 持久化，`docker compose down && up` 資料不遺失 |

## 架構設計

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│   Nginx     │───▶│  NestJS API  │───▶│  PostgreSQL  │
│  (Port 80)  │    │  (Port 3000) │    │              │
└─────────────┘    └──────┬───────┘    └──────────────┘
                          │
┌─────────────┐           │            ┌──────────────┐
│  Vue 3 前端  │           └───────────▶│    Redis     │
│ (Port 5173) │                        │              │
└─────────────┘                        └──────────────┘
```

| 容器 | 技術棧 | 說明 |
| :--- | :--- | :--- |
| **nginx** | Nginx Alpine | 反向代理，將 API 請求轉發到後端 |
| **api** | NestJS + TypeORM | REST API、排程器、檢查服務、TG 告警 |
| **frontend** | Vue 3 + Vite | 前端開發伺服器（獨立容器運行） |
| **db** | PostgreSQL 15 | 資料持久化 |
| **redis** | Redis 7 | 預留快取/佇列接口 |

> ⚡ 前端與後端容器**完全獨立運行**，互不依賴。

## 快速啟動

### 前置需求

- Docker & Docker Compose

### 一鍵啟動

```bash
cd Website_Monitoring
docker compose up --build -d
```

啟動後可訪問：

| 服務 | URL |
| :--- | :--- |
| 前端儀表板 | http://localhost:5173 |
| API（透過 Nginx） | http://localhost/sites |

### 停止服務

```bash
docker compose down
```

## 使用方式

### 1. 新增監控域名

在前端頁面點擊「+ 新增網站」，輸入域名（例如 `www.google.com`），**不需要**加 `http://` 或 `https://` 前綴。

勾選需要的監控協定：
- **HTTP** — 監控 HTTP 連線狀態
- **HTTPS** — 監控 HTTPS 連線狀態（自動啟用 TLS 證書檢查）
- **TLS** — 獨立 TLS 證書到期檢查（勾選 HTTPS 時自動啟用）
- **WHOIS** — 域名 WHOIS 到期檢查

設定檢查間隔與告警門檻：
- **HTTP/HTTPS 間隔** — 檢查頻率（秒，最低 60，預設 300）
- **TLS 檢查間隔** — 檢查頻率（天，最低 1，預設 1）
- **WHOIS 檢查間隔** — 檢查頻率（天，最低 1，預設 1）
- **失敗門檻** — HTTP 連續失敗幾次後告警（預設 3）

> 域名不可重複 — 每個域名只能新增一次。

### 2. 域名分組

在群組列輸入群組名稱並按 `+` 建立新群組。域名可同時屬於**多個群組**——在新增/編輯域名時用 checkbox 勾選群組。點擊群組標籤即可篩選顯示。

### 3. JSON 批量匯入

點擊「JSON 批量匯入」按鈕，貼上以下格式的 JSON：

```json
{
  "groupIds": [],
  "sites": [
    {
      "domain": "www.google.com",
      "checkHttp": true,
      "checkHttps": true,
      "checkWhois": false,
      "httpCheckIntervalSeconds": 300,
      "failureThreshold": 3
    },
    {
      "domain": "github.com",
      "checkHttps": true,
      "httpCheckIntervalSeconds": 600,
      "tlsCheckIntervalDays": 1,
      "domainCheckIntervalDays": 7
    }
  ]
}
```

也可以直接貼上陣列格式：

```json
[
  { "domain": "example.com" },
  { "domain": "www.github.com", "checkWhois": true, "failureThreshold": 5 }
]
```

**欄位說明：**

| 欄位 | 類型 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `domain` | string | *(必填)* | 域名，不含 http/https 前綴 |
| `checkHttp` | boolean | `true` | 是否監控 HTTP |
| `checkHttps` | boolean | `true` | 是否監控 HTTPS（自動啟用 TLS） |
| `checkTls` | boolean | `true` | 是否檢查 TLS 證書到期 |
| `checkWhois` | boolean | `true` | 是否檢查 WHOIS 到期 |
| `httpCheckIntervalSeconds` | number | `300` | HTTP/HTTPS 檢查間隔（秒，最低 60） |
| `tlsCheckIntervalDays` | number | `1` | TLS 檢查間隔（天，最低 1） |
| `domainCheckIntervalDays` | number | `1` | WHOIS 檢查間隔（天，最低 1） |
| `failureThreshold` | number | `3` | HTTP/HTTPS 連續失敗幾次後發送告警 |
| `groupIds` | string[] | `[]` | 指定群組 ID（支援多群組） |

### 4. 檢查歷史

每個域名卡片有 📊 按鈕，點擊後可查看最近 24 小時內所有檢查結果，包含：檢查時間、健康狀態、HTTP 狀態碼、TLS 剩餘天數、域名剩餘天數、錯誤詳情。

### 5. Telegram 告警設定

展開頁面上方的「🔔 Telegram 告警設定」面板：

1. 填入 **Bot Token**（從 [@BotFather](https://t.me/BotFather) 取得）
2. 填入 **Chat ID**（個人或群組/頻道 ID）
3. 設定 **TLS 告警天數**（預設 14 天）和**域名告警天數**（預設 30 天）
4. 勾選「啟用 Telegram 告警」
5. 點擊「💾 儲存設定」

可點擊「📤 發送測試訊息」驗證連線是否正常。

**到期告警訊息範例：**

```
🚨 網站監控告警 🚨

🔐 TLS 證書即將到期
  🟡 example.com — 剩餘 12 天

🌐 域名即將到期
  🟠 test.com — 剩餘 10 天

⏰ 告警時間: 2026/2/7 下午8:00:00
📋 共 2 項需要關注
```

**連續失敗告警訊息範例：**

```
🔥 連續失敗告警 🔥

  🟠 example.com — 連續失敗 3 次（門檻 3）
  🔴 test.com — 連續失敗 6 次（門檻 3）

⏰ 告警時間: 2026/2/7 下午8:01:00
⚠️ 共 2 個域名連續失敗
```

## 批量處理機制

為避免同時檢查幾百個域名造成服務壓力：

- 每批 **5 個域名**同時檢查
- 批次間延遲 **2 秒**
- 每個域名的 HTTP/HTTPS、TLS、WHOIS 檢查有**獨立間隔**，未到期的檢查會被跳過
- 所有狀態（最後檢查時間、失敗計數）都**存入 DB**，Docker 重啟後不會遺失

## API 文件

### Sites API

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `POST` | `/sites` | Admin/Editor | 新增監控域名（擋掉重複） |
| `POST` | `/sites/batch` | Admin/Editor | 批量匯入域名（擋掉重複） |
| `GET` | `/sites` | JWT | 取得所有域名（含群組 + 最新檢查結果） |
| `GET` | `/sites/:id` | JWT | 取得單一域名 |
| `GET` | `/sites/:id/history?range=` | JWT | 取得檢查歷史（支援 1h/12h/24h/1d/7d/14d） |
| `PUT` | `/sites/bulk` | Admin/Editor | 批量修改多個域名監控設定 |
| `PUT` | `/sites/:id` | Admin/Editor | 更新域名設定 |
| `PUT` | `/sites/:id/status/:status` | Admin/Editor | 切換監控狀態（active/paused） |
| `DELETE` | `/sites/:id` | Admin | 刪除域名 |

### Groups API

| 方法 | 路徑 | 說明 |
| :--- | :--- | :--- |
| `POST` | `/groups` | 建立群組 |
| `GET` | `/groups` | 取得所有群組（含域名列表） |
| `GET` | `/groups/:id` | 取得單一群組 |
| `PUT` | `/groups/:id` | 更新群組 |
| `DELETE` | `/groups/:id` | 刪除群組（域名變為未分組） |

### Auth API

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | 無 | 登入（回傳 JWT + 使用者資訊） |
| `GET` | `/auth/me` | JWT | 取得目前使用者資訊 |
| `PUT` | `/auth/change-password` | JWT | 修改自己的密碼 |
| `GET` | `/auth/users` | Admin | 列出所有使用者 |
| `POST` | `/auth/users` | Admin | 建立使用者 |
| `PUT` | `/auth/users/:id` | Admin | 更新使用者（角色、密碼、群組） |
| `DELETE` | `/auth/users/:id` | Admin | 刪除使用者 |

### Audit API

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `GET` | `/audit` | Admin | 取得全部操作紀錄 |
| `GET` | `/audit/me` | JWT | 取得自己的操作紀錄 |

### Alert API

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `GET` | `/alert/config` | JWT | 取得告警設定 |
| `PUT` | `/alert/config` | Admin | 更新告警設定 |
| `POST` | `/alert/test` | Admin | 發送 Telegram 測試訊息 |

### Retention API

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `GET` | `/retention/config` | JWT | 取得紀錄保留設定 |
| `PUT` | `/retention/config` | Admin | 更新紀錄保留設定（啟用/停用自動清理、設定保留天數） |

## Docker Compose 服務

```yaml
services:
  nginx:        # Nginx 反向代理 (Port 80)
  frontend:     # Vue 3 前端開發伺服器 (Port 5173)，獨立運行
  api:          # NestJS 後端 API (Port 3000，僅容器內部)
  db:           # PostgreSQL 15 資料庫
  redis:        # Redis 7 快取
```

## 技術棧

- **後端:** NestJS, TypeORM, PostgreSQL, Redis, Passport.js, JWT, bcryptjs, axios, whois-json
- **前端:** Vue 3, Vite, axios
- **部署:** Docker Compose, Nginx（DB 與 Redis 使用 named volume 持久化）
- **認證:** JWT + 角色權限控制（admin/allread/onlyedit/onlyread）
- **告警:** Telegram Bot API
