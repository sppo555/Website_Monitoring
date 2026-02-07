# 📋 網站監控系統 — 功能版本紀錄

> 完整功能清單，按版本分類條列

---

## v3.0 — 頁面獨立化 + 紀錄保留管理 + 歷史查詢強化

> 2026-02-07

### 前端改動

- **導航列頁面切換**：首頁只保留監控儀表板，使用者管理 / 操作紀錄 / Telegram 設定 / 系統設定 各為獨立頁面，透過頂部導航列切換
- **操作紀錄獨立頁面**（`AuditLogPage`）：全頁表格，支援「動作」和「目標」篩選欄位，admin 可切換「我的紀錄 / 全部紀錄」
- **系統設定頁面**（`RetentionSettings`）：admin 可設定操作紀錄和域名監控紀錄的保留天數，打勾啟用後才會有每日排程自動清理
- **歷史查詢時間範圍**（`HistoryModal`）：從固定 24h 改為可選 `1h / 12h / 24h / 1d / 7d / 14d`，按鈕切換即時載入

### 後端改動

- **RetentionConfig 實體**：儲存操作紀錄和監控紀錄的保留天數開關與設定
- **RetentionService**：提供讀取/更新設定 API，每日凌晨 3:00 Cron 排程自動刪除過期紀錄
- **RetentionController**：`GET /retention/config`（讀取設定）、`PUT /retention/config`（admin 更新設定）
- **歷史查詢 API**：`GET /sites/:id/history?range=7d` 支援 `1h / 12h / 24h / 1d / 7d / 14d`（最大 14 天）

---

## v2.0 — 使用者認證 + 角色權限 + 操作紀錄 + 多群組 + 批量編輯

> 2026-02-07

### 使用者認證與權限

- **JWT 登入機制**：`POST /auth/login` 回傳 access_token，所有 API 需帶 Bearer Token
- **預設 admin 帳號**：帳號 `admin`，密碼 `admin`（首次啟動自動建立）
- **4 種角色**：
  - `admin` — 完全存取，可管理使用者、修改所有設定
  - `allread` — 讀取全部群組的域名（唯讀）
  - `onlyedit` — 只能編輯被指派群組的域名
  - `onlyread` — 只能讀取被指派群組的域名
- **使用者管理**（admin）：`GET/POST/PUT/DELETE /auth/users`，指派角色和群組
- **修改密碼**：`PUT /auth/change-password`，所有使用者可改自己密碼

### 操作紀錄（Audit Log）

- **AuditLog 實體**：記錄所有重要操作（登入、新增/修改/刪除域名、改密碼、使用者管理）
- **查詢 API**：
  - `GET /audit` — admin 查全部日誌
  - `GET /audit/me` — 使用者查自己日誌

### 多群組域名

- **Site ↔ Group ManyToMany 關聯**：一個域名可同時屬於多個群組
- **前端 SiteFormModal**：`groupId` 下拉改為 `groupIds` checkbox 多選
- **前端 SiteList**：多群組 badges 顯示在域名卡片上

### 搜尋與批量編輯

- **搜尋欄**：即時過濾目前選定群組內的域名
- **批量勾選**：checkbox 全選 / 單選多個域名
- **批量編輯**（`BulkEditModal`）：勾選要修改的欄位，套用到多個域名
- **批量更新 API**：`PUT /sites/bulk`

### 前端元件

- **LoginPage**：登入表單
- **UserManagement**：admin 管理使用者介面
- **ChangePasswordModal**：修改密碼彈窗
- **AuditLogPanel**：操作紀錄面板（可展開）
- **BulkEditModal**：批量編輯彈窗

### 資料持久化

- **Docker named volumes**：`postgres_data` 和 `redis_data`
- `docker compose down && up` 後資料不遺失

---

## v1.0 — 基礎監控系統

> 初始版本

### 域名監控

- **HTTP 監控**：檢查目標域名的 HTTP 連線狀態碼
- **HTTPS 監控**：檢查目標域名的 HTTPS 連線狀態碼（勾選 HTTPS 自動啟用 TLS 檢查）
- **TLS 證書檢查**：連線 443 埠，檢查 SSL 證書剩餘天數
- **WHOIS 域名到期**：查詢域名 WHOIS 資訊，計算註冊到期剩餘天數
- **獨立監控開關**：每個域名可獨立啟用/關閉 HTTP、HTTPS、TLS、WHOIS 四項監控
- **獨立檢查間隔**：
  - HTTP/HTTPS — 按秒設定（最低 60s，預設 300s）
  - TLS — 按天設定（最低 1 天，預設 1 天）
  - WHOIS — 按天設定（最低 1 天，預設 1 天）
- **失敗計數告警**：HTTP/HTTPS 連續失敗達到設定次數後才觸發告警（預設 3 次）
- **暫停/啟動**：可單獨暫停或啟動任何域名的監控

### 域名分組

- **建立群組**：輸入群組名稱按 `+` 建立
- **群組篩選**：點擊群組標籤篩選顯示

### 批量匯入

- **JSON 批量匯入**：透過 JSON 格式一次匯入多個域名
- **域名重複防護**：新增或批量匯入時，自動擋掉已存在的域名

### 監控紀錄

- **24h 檢查歷史**：每個域名可查看最近 24 小時內所有檢查結果（📊 按鈕）

### Telegram 告警

- **告警設定頁面**：在網頁上設定 Bot Token、Chat ID、告警天數門檻
- **TLS/域名到期告警**：到期前自動發送 Telegram 通知（含 Emoji）
- **連續失敗告警**：HTTP/HTTPS 連續失敗超過門檻時發送告警
- **測試訊息**：可發送 Telegram 測試訊息驗證連線
- **告警設定存入 DB**：重啟後設定不遺失

### 排程與批量處理

- **自動排程**：每分鐘執行，依各域名獨立間隔決定是否到期需檢查
- **批量分批處理**：每 5 個域名一批，批次間延遲 2 秒，避免瞬間大量請求
- **狀態持久化**：所有設定、檢查時間、失敗計數全部存入 PostgreSQL

### 架構

- **後端**：NestJS + TypeORM + PostgreSQL + Redis
- **前端**：Vue 3 + Vite + axios
- **部署**：Docker Compose（Nginx 反向代理 + 前後端容器獨立運行）

### API（v1.0）

| 方法 | 路徑 | 說明 |
| :--- | :--- | :--- |
| `POST` | `/sites` | 新增監控域名 |
| `POST` | `/sites/batch` | 批量匯入域名 |
| `GET` | `/sites` | 取得所有域名 |
| `GET` | `/sites/:id` | 取得單一域名 |
| `GET` | `/sites/:id/history` | 取得檢查歷史 |
| `PUT` | `/sites/:id` | 更新域名設定 |
| `PUT` | `/sites/:id/status/:status` | 切換監控狀態 |
| `DELETE` | `/sites/:id` | 刪除域名 |
| `POST` | `/groups` | 建立群組 |
| `GET` | `/groups` | 取得所有群組 |
| `PUT` | `/groups/:id` | 更新群組 |
| `DELETE` | `/groups/:id` | 刪除群組 |
| `GET` | `/alert/config` | 取得告警設定 |
| `PUT` | `/alert/config` | 更新告警設定 |
| `POST` | `/alert/test` | 發送測試訊息 |

---

## 完整 API 列表（截至 v3.0）

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

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `POST` | `/groups` | Admin | 建立群組 |
| `GET` | `/groups` | JWT | 取得所有群組 |
| `GET` | `/groups/:id` | JWT | 取得單一群組 |
| `PUT` | `/groups/:id` | Admin | 更新群組 |
| `DELETE` | `/groups/:id` | Admin | 刪除群組 |

### Auth API

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | 無 | 登入（回傳 JWT） |
| `GET` | `/auth/me` | JWT | 取得目前使用者資訊 |
| `PUT` | `/auth/change-password` | JWT | 修改自己的密碼 |
| `GET` | `/auth/users` | Admin | 列出所有使用者 |
| `POST` | `/auth/users` | Admin | 建立使用者 |
| `PUT` | `/auth/users/:id` | Admin | 更新使用者 |
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

### Retention API（v3.0 新增）

| 方法 | 路徑 | 權限 | 說明 |
| :--- | :--- | :--- | :--- |
| `GET` | `/retention/config` | JWT | 取得紀錄保留設定 |
| `PUT` | `/retention/config` | Admin | 更新紀錄保留設定 |

---

## 技術棧

- **後端**：NestJS, TypeORM, PostgreSQL, Redis, Passport.js, JWT, bcryptjs, axios, whois-json
- **前端**：Vue 3, Vite, axios
- **部署**：Docker Compose, Nginx（DB 與 Redis 使用 named volume 持久化）
- **認證**：JWT + 角色權限控制（admin / allread / onlyedit / onlyread）
- **告警**：Telegram Bot API
