# 🖥 SiteWatcher — 網站監控系統

> **[📖 English Documentation](./README.md)**

基於全棧 TypeScript（NestJS + Vue 3）和 Docker 容器化技術的輕量級網站監控系統，支援使用者認證與角色權限（RBAC）、多群組域名管理、多協定監控（HTTP/HTTPS/TLS/WHOIS）、Telegram 告警通知、操作紀錄審計、國際化（中英文切換）、批量編輯與匯入。

## 功能總覽

| 功能 | 說明 |
| :--- | :--- |
| **使用者認證** | JWT 登入機制，預設 admin 帳號（`admin`/`admin`） |
| **角色權限控制（RBAC）** | 4 種角色：`admin`（完全存取）、`allread`（讀取全部）、`onlyedit`（編輯指派群組）、`onlyread`（讀取指派群組） |
| **修改密碼** | 所有使用者可改自己密碼；admin 可改任何使用者密碼 |
| **操作紀錄** | 所有操作（登入、CRUD、改密碼）皆記錄；admin 查看全部日誌，使用者查看自己 |
| **HTTP 監控** | 檢查目標域名的 HTTP 連線狀態碼 |
| **HTTPS 監控** | 檢查 HTTPS 連線狀態碼（勾選 HTTPS 自動啟用 TLS 檢查） |
| **TLS 證書檢查** | 連線 443 埠，檢查 SSL 證書剩餘天數 |
| **WHOIS 域名到期** | 查詢域名 WHOIS 資訊，計算註冊到期剩餘天數 |
| **新增即檢查** | 新增網站（單一或批量）後立即執行完整檢查（HTTP + TLS + WHOIS），非阻塞 |
| **結果帶入機制** | 排程檢查時，若 TLS/WHOIS 未到期，會自動帶入上一次的已知值，儀表板不再顯示空值 |
| **多群組域名** | 一個域名可同時屬於多個群組（多對多關聯） |
| **域名搜尋** | 搜尋欄位即時過濾目前選定群組內的域名 |
| **批量編輯** | 勾選多個域名，一次修改監控項目設定，**包含群組指派** |
| **獨立監控開關** | 每個域名可獨立啟用/關閉 HTTP、HTTPS、TLS、WHOIS 四項監控 |
| **域名格式驗證** | 符合 RFC 952/1123：僅允許 `a-z`、`0-9`、`-`、`.`；自動去除 `http://`/`https://` 前綴；擋掉重複域名 |
| **JSON 批量匯入** | 透過 JSON 格式一次匯入多個域名，支援群組指派，含完整格式驗證 |
| **搜尋篩選器** | 可依監控項目（HTTP/HTTPS/TLS/WHOIS）和狀態（監控中/已暫停）多選篩選域名 |
| **JSON 匯出** | 匯出全部或勾選域名的設定為 JSON（與批量匯入格式相容） |
| **批量刪除** | 勾選多個域名一次刪除（僅 admin），同時刪除關聯的檢查紀錄 |
| **群組編輯模式** | 批量編輯群組時可選擇「覆蓋」或「新增」模式 |
| **歷史紀錄綁定域名** | 檢查歷史綁定域名字串，改名再改回可恢復歷史紀錄 |
| **Telegram 告警** | TLS/域名到期或 HTTP 連續失敗時，自動發送 Telegram 通知；設定存入 DB |
| **TG Group Topics** | Telegram Chat ID 支援 `chatId:topicId` 格式（例：`-1003758002772:646`） |
| **失敗計數告警** | HTTP/HTTPS 連續失敗達到設定次數後才觸發告警（可自訂） |
| **獨立檢查間隔** | HTTP/HTTPS 按秒設定（最低 60s），TLS/WHOIS 按天設定（最低 1 天） |
| **批量分批處理** | 檢查時每 5 個域名一批，批次間延遲 2 秒，避免瞬間大量請求 |
| **彈性檢查歷史** | 可選時間範圍查看檢查結果：1h / 12h / 24h / 1d / 7d / 14d / 自訂 |
| **告警設定頁面** | 在網頁上設定 TG Bot Token、Chat ID、告警天數門檻（存入 DB） |
| **自動排程** | 每分鐘執行排程，依各域名獨立間隔決定是否到期需檢查 |
| **暫停/啟動** | 可單獨暫停或啟動任何域名的監控 |
| **紀錄保留管理** | admin 可設定操作紀錄和監控紀錄的保留天數，打勾啟用後每日排程自動清理過期資料 |
| **國際化（i18n）** | 支援英文與繁體中文完整切換，語言偏好存入 localStorage |
| **獨立頁面** | 儀表板、使用者管理、操作紀錄、Telegram 設定、系統設定 各為獨立頁面，透過導航列切換 |
| **群組 Tab 權限** | 非 admin 使用者只看到有權限的群組 tab，計數只反映可見域名 |
| **資料持久化** | 所有資料存入 PostgreSQL，Docker named volume 持久化，`docker compose down && up` 資料不遺失 |
| **時區處理** | 後端存 UTC，前端依瀏覽器時區自動顯示本地時間 |

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
| **nginx** | Nginx Alpine | 反向代理（Port 80），將 `/api/*` 請求轉發到後端 |
| **api** | NestJS + TypeORM | REST API、排程器、檢查服務、TG 告警 |
| **frontend** | Vue 3 + Vite | 前端開發伺服器（Port 5173，獨立容器運行） |
| **db** | PostgreSQL 15 | 資料持久化（named volume） |
| **redis** | Redis 7 | 預留快取/佇列接口（named volume） |

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
| API（透過 Nginx） | http://localhost/api/sites |

預設帳號：**admin** / **admin**（首次登入後請立即修改密碼）。

### 停止服務

```bash
docker compose down
```

> 資料存在 Docker named volume（`postgres_data`、`redis_data`）中。若要清除所有資料：`docker compose down -v`。

## 使用方式

### 1. 新增監控域名

在前端頁面點擊「+ 新增網站」，輸入域名（例如 `www.google.com`）。

**域名輸入規則（RFC 952/1123）：**
- 直接輸入域名 — `http://` / `https://` 前綴會**自動去除**
- 僅允許英文字母（`a-z`）、數字（`0-9`）、連字號（`-`）、點（`.`）
- 不可以連字號開頭或結尾
- 每段（兩個點之間）最多 63 字元，總長度最多 253 字元
- 輸入無效格式時即時顯示錯誤訊息，送出按鈕自動停用

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

> 域名不可重複 — 每個域名只能新增一次。若偵測到重複，會顯示錯誤訊息且表單保持可編輯狀態（不會卡住）。

### 2. 域名分組

在群組列輸入群組名稱並按 `+` 建立新群組。域名可同時屬於**多個群組**——在新增/編輯域名時用 checkbox 勾選群組。點擊群組標籤即可篩選顯示。

### 3. 批量編輯

勾選多個域名，點擊「批量修改」按鈕。可修改：
- HTTP / HTTPS / TLS / WHOIS 開關
- HTTP 間隔、失敗門檻
- **所屬群組**，可選擇模式：
  - **覆蓋**（預設）— 取代現有群組
  - **新增** — 保留現有群組，只追加新的

僅勾選的項目會被修改，未勾選的保持原值。

### 3.1 批量刪除

勾選域名後點擊「批量刪除」（僅 admin 可見）。所有選取的域名及其檢查紀錄將被永久刪除。

### 3.2 JSON 匯出

點擊「JSON 匯出」下載所有域名設定。若有勾選域名，點擊「匯出勾選 (N)」只匯出勾選的。匯出的 JSON 格式與批量匯入相容。

### 3.3 搜尋篩選器

點擊搜尋欄旁的「篩選」按鈕展開篩選列：
- **監控項目**：HTTP / HTTPS / TLS / WHOIS（AND 邏輯 — 勾選的都要啟用）
- **狀態**：監控中 / 已暫停（OR 邏輯 — 勾兩個等於全部）
- 點擊「清除」重置所有篩選條件

### 4. JSON 批量匯入

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
| `domain` | string | *(必填)* | 域名（自動去除 `http://`/`https://`，依 RFC 驗證格式） |
| `checkHttp` | boolean | `true` | 是否監控 HTTP |
| `checkHttps` | boolean | `true` | 是否監控 HTTPS（自動啟用 TLS） |
| `checkTls` | boolean | `true` | 是否檢查 TLS 證書到期 |
| `checkWhois` | boolean | `true` | 是否檢查 WHOIS 到期 |
| `httpCheckIntervalSeconds` | number | `300` | HTTP/HTTPS 檢查間隔（秒，最低 60） |
| `tlsCheckIntervalDays` | number | `1` | TLS 檢查間隔（天，最低 1） |
| `domainCheckIntervalDays` | number | `1` | WHOIS 檢查間隔（天，最低 1） |
| `failureThreshold` | number | `3` | HTTP/HTTPS 連續失敗幾次後發送告警 |
| `groupIds` | string[] | `[]` | 指定群組 ID（支援多群組） |

### 5. 檢查歷史

每個域名卡片有 📊 按鈕，點擊後可選擇時間範圍（1h / 12h / 24h / 1d / 7d / 14d / 自訂）查看檢查結果，包含：檢查時間、健康狀態、HTTP 狀態碼、TLS 剩餘天數、域名剩餘天數、錯誤詳情。

### 6. Telegram 告警設定

透過導航列進入「Telegram 設定」頁面：

1. 填入 **Bot Token**（從 [@BotFather](https://t.me/BotFather) 取得）
2. 填入 **Chat ID**（個人或群組/頻道 ID）。支援 **Group Topics** 格式：`chatId:topicId`（例：`-1003758002772:646`）
3. 設定 **TLS 告警天數**（預設 14 天）和**域名告警天數**（預設 30 天）
4. 勾選「啟用 Telegram 告警」
5. 點擊「儲存設定」

可點擊「發送測試訊息」驗證連線是否正常。

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

### 7. 語言切換

點擊導航列右上角的語言按鈕（🌐 EN / CN）即可在英文與繁體中文之間切換。語言偏好會儲存在 `localStorage` 中。

## 批量處理機制

為避免同時檢查幾百個域名造成服務壓力：

- 每批 **5 個域名**同時檢查
- 批次間延遲 **2 秒**
- 每個域名的 HTTP/HTTPS、TLS、WHOIS 檢查有**獨立間隔**，未到期的檢查會被跳過
- TLS/WHOIS 值在未到期時會**帶入上次已知值**，確保儀表板始終顯示資料
- 新增的網站會**立即執行完整檢查**（HTTP + TLS + WHOIS），不需等待下一個排程週期
- 所有狀態（最後檢查時間、失敗計數）都**存入 DB**，Docker 重啟後不會遺失

## API 文件

### Sites API

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/sites` | Admin/Editor | 新增監控域名（驗證格式、擋掉重複、觸發即時檢查） |
| `POST` | `/api/sites/batch` | Admin/Editor | 批量匯入域名（驗證格式、擋掉重複、觸發即時檢查） |
| `GET` | `/api/sites` | JWT | 取得所有域名（含群組 + 最新檢查結果） |
| `GET` | `/api/sites/:id` | JWT | 取得單一域名 |
| `GET` | `/api/sites/export` | JWT | 匯出全部或指定域名設定為 JSON |
| `GET` | `/api/sites/:id/history?range=` | JWT | 取得檢查歷史（按域名字串查詢，支援 1h/12h/24h/1d/7d/14d） |
| `PUT` | `/api/sites/bulk` | Admin/Editor | 批量修改多個域名監控設定（群組支援 replace/add 模式） |
| `PUT` | `/api/sites/:id` | Admin/Editor | 更新域名設定（改名不刪歷史） |
| `PUT` | `/api/sites/:id/status/:status` | Admin/Editor | 切換監控狀態（active/paused） |
| `DELETE` | `/api/sites/bulk` | Admin | 批量刪除域名及其檢查紀錄 |
| `DELETE` | `/api/sites/:id` | Admin | 刪除域名 |

### Groups API

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/groups` | Admin | 建立群組 |
| `GET` | `/api/groups` | JWT | 取得所有群組（含域名列表） |
| `GET` | `/api/groups/:id` | JWT | 取得單一群組 |
| `PUT` | `/api/groups/:id` | Admin | 更新群組 |
| `DELETE` | `/api/groups/:id` | Admin | 刪除群組（域名變為未分組） |

### Auth API

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | 無 | 登入（回傳 JWT + 使用者資訊） |
| `GET` | `/api/auth/me` | JWT | 取得目前使用者資訊 |
| `PUT` | `/api/auth/change-password` | JWT | 修改自己的密碼 |
| `GET` | `/api/auth/users` | Admin | 列出所有使用者 |
| `POST` | `/api/auth/users` | Admin | 建立使用者 |
| `PUT` | `/api/auth/users/:id` | Admin | 更新使用者（角色、密碼、群組） |
| `DELETE` | `/api/auth/users/:id` | Admin | 刪除使用者 |

### Audit API

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/audit` | Admin | 取得全部操作紀錄 |
| `GET` | `/api/audit/me` | JWT | 取得自己的操作紀錄 |

### Alert API

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/alert/config` | JWT | 取得告警設定 |
| `PUT` | `/api/alert/config` | Admin | 更新告警設定 |
| `POST` | `/api/alert/test` | Admin | 發送 Telegram 測試訊息 |

### Retention API

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/retention/config` | JWT | 取得紀錄保留設定 |
| `PUT` | `/api/retention/config` | Admin | 更新紀錄保留設定（啟用/停用自動清理、設定保留天數） |

## 專案結構

```
Website_Monitoring/
├── docker-compose.yml          # Docker Compose 編排
├── nginx/
│   └── default.conf            # Nginx 反向代理設定
├── backend-ts/                 # NestJS 後端
│   └── src/
│       ├── app.module.ts       # 根模組
│       ├── auth/               # 認證（JWT、RBAC、使用者管理）
│       ├── site/               # 網站 CRUD、檢查結果、實體
│       ├── group/              # 群組管理
│       ├── checker/            # 檢查服務與模組（HTTP/TLS/WHOIS）
│       ├── scheduler/          # Cron 排程器（每分鐘）
│       ├── alert/              # Telegram 告警服務與設定
│       ├── audit/              # 操作紀錄
│       └── retention/          # 紀錄保留管理
├── frontend/                   # Vue 3 前端
│   └── src/
│       ├── App.vue             # 主佈局含導航列
│       ├── auth.ts             # 認證狀態管理
│       ├── i18n/               # 國際化（zh-TW、en）
│       └── components/         # Vue 元件
│           ├── LoginPage.vue
│           ├── SiteList.vue
│           ├── SiteFormModal.vue
│           ├── BatchImportModal.vue
│           ├── BulkEditModal.vue
│           ├── HistoryModal.vue
│           ├── TelegramSettings.vue
│           ├── UserManagement.vue
│           ├── ChangePasswordModal.vue
│           ├── AuditLogPage.vue
│           ├── AuditLogPanel.vue
│           └── RetentionSettings.vue
└── README.md / README.zh-TW.md
```

## Docker Compose 服務

```yaml
services:
  nginx:        # Nginx 反向代理 (Port 80)
  frontend:     # Vue 3 前端開發伺服器 (Port 5173)，獨立運行
  api:          # NestJS 後端 API (Port 3000，僅容器內部)
  db:           # PostgreSQL 15 資料庫（named volume: postgres_data）
  redis:        # Redis 7 快取（named volume: redis_data）
```

## 技術棧

- **後端:** NestJS, TypeORM, PostgreSQL, Redis, Passport.js, JWT, bcryptjs, axios, whois-json, tls, @nestjs/schedule
- **前端:** Vue 3（Composition API）, Vite, axios, 自訂 i18n
- **部署:** Docker Compose, Nginx 反向代理, 持久化 named volume
- **認證:** JWT + 角色權限控制（admin / allread / onlyedit / onlyread）
- **告警:** Telegram Bot API
- **時區:** 後端存 UTC，前端依瀏覽器時區顯示
