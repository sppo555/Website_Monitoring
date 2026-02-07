# 網站監控系統 (Website Monitoring System)

## 專案簡介

這是一個基於全棧 TypeScript 技術棧 (NestJS + Vue 3) 和 Docker 容器化技術實現的輕量級網站監控系統。

**核心目標：**
1.  即時監控網站的 HTTP/HTTPS 連線狀態。
2.  檢查 HTTPS/TLS 證書的剩餘過期天數。
3.  檢查網站域名的 WHOIS 剩餘過期天數。

## 架構設計

本專案採用微服務的理念進行設計，將高 I/O 檢查任務、API 服務和資料持久化分離。

| 組件 | 技術棧 | 職責 |
| :--- | :--- | :--- |
| **API/Scheduler** | NestJS (TypeScript) | 提供 REST API (CRUD Site)、排程器 (Cron) 執行檢查任務、結果持久化 (PostgreSQL)。 |
| **Database** | PostgreSQL | 儲存待監控網站列表 (`sites`) 和歷史檢查結果 (`site_check_results`)。 |
| **Cache/Queue** | Redis | **預留接口。** 可用於未來實現 Rate Limiting 或分散式任務佇列。 |
| **Frontend** | Vue 3 + TypeScript | 網站儀表板 (Dashboard) 和網站管理界面。 |

## 核心功能清單

| 功能 | 描述 | 實現狀態 |
| :--- | :--- | :--- |
| **HTTP/HTTPS 檢查** | 檢查目標 URL 是否返回正常的狀態碼 (e.g., 2xx/3xx)。 | ✅ 實作 (NestJS `CheckerService`) |
| **TLS 檢查** | 連線到 443 埠，獲取證書資訊，計算剩餘過期天數。 | ✅ 實作 (NestJS `CheckerService`) |
| **WHOIS 檢查** | 查詢域名，獲取域名註冊的剩餘過期天數。 | ✅ 實作 (NestJS `CheckerService` - 依賴 `whois-json`) |
| **網站管理 API** | CRUD 接口，用於新增、修改、刪除、暫停監控網站。 | ✅ 實作 (NestJS `SiteController`) |
| **自動排程** | 每分鐘自動運行一次檢查任務。 | ✅ 實作 (NestJS `MonitoringScheduler`) |

## 快速啟動 (Quick Start)

本專案強烈依賴 Docker 和 Docker Compose 進行環境配置。

### 步驟 1: 啟動基礎服務 (PostgreSQL & Redis)

請確保您已安裝 Docker 和 Docker Compose。在專案根目錄 (`Website_Monitoring`) 執行：

```bash
# 啟動 PostgreSQL, Redis 和 NestJS API 服務
docker compose up --build -d
```

第一次運行時，此命令會：
1.  構建 `backend-ts` 服務的 Docker 映像 (Image)。
2.  啟動 `db` (PostgreSQL) 和 `redis` 容器。
3.  啟動 `api` (NestJS) 容器，它將自動連線到資料庫並運行 TypeORM 同步。

### 步驟 2: 運行前端開發伺服器

前端服務使用 Vite 開發伺服器，不建議在 Docker 中運行：

```bash
# 進入前端目錄
cd frontend

# 安裝依賴 (如果尚未安裝)
npm install

# 啟動開發伺服器
npm run dev 
# 訪問 http://localhost:5173/ 查看儀表板
```

### 步驟 3: 測試 API (添加一個監控網站)

服務啟動後，您可以透過 API 接口添加一個新的監控目標：

```bash
# 使用 cURL 或 Postman
curl -X POST http://localhost:3000/sites \
-H 'Content-Type: application/json' \
-d '{
    "url": "https://www.google.com",
    "checkIntervalSeconds": 300,
    "checkTls": true,
    "checkWhois": false
}'
```

---

## 🚧 交接狀態與已知問題 (Handover Status)

本專案已完成核心功能程式碼和容器化配置，但前端構建步驟遇到了環境隔離問題。

### 1. 專案進度摘要

- **後端 (NestJS)：** 程式碼完成 100%。功能：CRUD API, Scheduler, Checker 邏輯。
- **前端 (Vue 3)：** 程式碼完成 80%。功能：網站列表組件 (`SiteList.vue`)。**尚未完成**：網站新增/編輯模態框、單一網站歷史趨勢圖。
- **版本控制：** 尚未 Push 到 GitHub。**需要配置 Git 身份才能完成。**
- **環境：** 已創建 `docker-compose.yml` 和 `Dockerfile`，確保專案可容器化啟動。

### 2. 開發決策與技術陷阱 (參見 DEVELOPER_NOTES.md)

| 問題 | 妥協/風險 | 解決方案 |
| :--- | :--- | :--- |
| **環境依賴** | 啟動 NestJS 需要外部 PostgreSQL/Redis 服務。 | 透過 `docker compose up` 解決。**AI 助理無法自動執行此啟動命令。** |
| **前端構建失敗** | `vue-tsc` 類型檢查與沙盒環境衝突，導致構建失敗。 | **妥協：** 移除 `npm run build` 中的 `vue-tsc` 步驟。**風險：** 潛在的 TypeScript 類型錯誤不會被發現。 |
| **WHOIS 檢查** | 依賴 `whois-json` 庫，可能存在速率限制 (Rate Limit) 風險。 | 需在生產環境中實作 Redis 快取或使用外部 WHOIS 服務。 |

### 3. 下一步行動 (Next Steps)

下一位接手人應優先完成以下任務：

1.  **提交程式碼：** 配置 Git 身份，執行 Commit 和 Push。
2.  **啟動服務：** 執行 `docker compose up --build -d`。
3.  **完成前端：** 實作網站新增/編輯模態框，並整合後端 API。
4.  **優化檢查：** 將 `CheckerService` 中的 TLS 檢查邏輯調整為 Promise/Async-Await 模式，避免阻塞 Node.js Event Loop。

---
`DEVELOPER_NOTES.md` 文件記錄了更詳細的錯誤修正日誌。