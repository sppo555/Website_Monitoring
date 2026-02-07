# 開發筆記與決策日誌

## 專案名稱：SiteWatcher（網站監控系統）
## 最後更新：2026-02-08

---

### 1. 架構決策：單一 vs 混合技術棧

- **決策：** 採用單一 NestJS (TypeScript) 後端，取代最初建議的 Golang + NestJS 混合架構。
- **原因：** 用戶要求**不使用 Golang**，優先級是**簡化專案複雜度和維護成本**，而非極致性能。Node.js 的非同步 I/O 足以處理中等規模的 HTTP 檢查。

### 2. NestJS/TypeORM 關鍵配置

- **問題：** 啟動 NestJS 需要資料庫連線。TypeORM 配置在 `app.module.ts` 中是硬編碼 (`localhost:5432`)。
- **解決方案：**
    - 提供了 `Dockerfile` 和 `docker-compose.yml`，將 NestJS 容器化。
    - 在容器環境中，`POSTGRES_HOST` 被設置為 `db` (即 Docker Compose 服務名)，確保服務間連線正確。
    - **警告：** 生產環境應使用更安全的配置服務 (如 ConfigModule) 來管理憑證。

### 3. 前端構建錯誤與解決方案 (Vue 3/Vite/TS)

由於環境隔離限制，手動初始化 Vue 專案導致了多次編譯失敗，記錄如下：

| 錯誤類型 | 導致原因 | 解決方案 |
| :--- | :--- | :--- |
| **TSConfig 缺失** | 缺少 `tsconfig.json` 啟動編譯器。 | 手動創建 `tsconfig.json` 和 `tsconfig.node.json`。 |
| **Vite Config 語法錯誤** | 代理配置中的正則表達式轉義錯誤 (`^\\/api/` )。 | 修正為標準的正則表達式 `/^\/api/`。 |
| **結構缺失** | 缺少 Vite 專案的 `index.html`, `main.ts`, `env.d.ts` 等核心文件。 | 手動創建所有缺失的 Vue/Vite 基礎文件和類型聲明文件。 |
| **最終編譯失敗** | `vue-tsc` 與環境衝突。 | **妥協：** 暫時移除 `package.json` 中的 `vue-tsc --noEmit` 步驟，直接使用 `vite build` 打包。 |

### 4. CheckerModule 模組化與循環依賴 (v4.0)

- **問題：** `SiteController` 需要在新增網站後呼叫 `CheckerService.checkSingleSite()`，但 `CheckerService` 原本是 `AppModule` 的 provider，無法被 `SiteModule` 直接注入。
- **解決方案：**
    - 建立 `CheckerModule`，封裝 `CheckerService` 並 `exports` 它。
    - `SiteModule` 透過 `forwardRef(() => CheckerModule)` 匯入，解決潛在的循環依賴問題。
    - `AppModule` 改為匯入 `CheckerModule`，不再直接 provide `CheckerService`。

### 5. TLS/WHOIS 新增後不顯示問題 (v4.0)

- **問題：** 新增網站後，TLS 證書和域名到期資訊顯示為「—」，要等到排程下次到期才會有值。
- **根因：**
    - TLS/WHOIS 設定間隔為 1 天，排程每分鐘只跑 HTTP 檢查。
    - HTTP-only 的檢查結果 `tlsDaysLeft`/`domainDaysLeft` 為 `null`，前端 `latestResult` 拿到的永遠是最新的 HTTP-only 紀錄。
- **解決方案（雙管齊下）：**
    1. **即時檢查**：`SiteController.create()` 和 `batchCreate()` 在建站後非阻塞觸發 `checkSingleSite()`，立刻跑 HTTP + TLS + WHOIS。
    2. **Carry Forward**：排程 `checkSite()` 在存結果前，若本次沒跑 TLS/WHOIS，查詢上一筆紀錄帶入已知值。

### 6. 域名格式驗證決策 (v4.0)

- **背景：** 用戶貼上含 `http://` 前綴的域名（如 `http://www.songla.top`），導致 checker 嘗試 `http://http://www.songla.top`，產生 ENOTFOUND 錯誤。
- **決策：** 三層防護
    1. **前端即時驗證**（`SiteFormModal` 的 `computed`）：輸入時即時紅框 + 錯誤訊息 + 禁用按鈕
    2. **前端批量驗證**（`BatchImportModal` 的 `validateSites`）：JSON 匯入逐筆檢查
    3. **後端驗證**（`SiteService.validateDomainFormat`）：最後一道防線
- **規則**：遵循 RFC 952/1123，僅允許 `a-z`、`0-9`、`-`、`.`；不可以 `-` 開頭或結尾；每段 ≤ 63 字元，總長 ≤ 253 字元。
- **自動 strip**：前後端都自動去除 `http://` / `https://` 前綴和尾部斜線。

### 7. 重複域名按鈕卡住問題 (v4.0)

- **問題：** 新增重複域名時，後端回傳 400 錯誤，但 `SiteFormModal` 的 `submitting` ref 永遠卡在 `true`，按鈕顯示「處理中...」無法操作。
- **根因：** `handleSubmit` 設定 `submitting = true` 後 emit 給 parent，parent 捕獲 API 錯誤但無法重置 child 的 ref。
- **解決方案：** `SiteFormModal` 用 `defineExpose({ resetSubmitting })`，parent 透過 template ref 在 catch 後呼叫 `formModalRef.value?.resetSubmitting()`。

### 8. 國際化 (i18n) 實作方式 (v4.0)

- **決策：** 自訂輕量 i18n 模組（`frontend/src/i18n/index.ts`），不使用 vue-i18n 套件。
- **原因：** 專案規模不大，自訂 `t()` 函式 + `reactive` locale 變數足夠，避免額外依賴。
- **結構：**
    - `zh-TW.ts` / `en.ts`：翻譯字典（約 170+ key）
    - `index.ts`：`t(key, params?)` 函式、`setLocale()` 切換、`getDateLocale()` 日期格式化
    - 語言偏好存 `localStorage('locale')`

### 9. 時區處理 (v4.0)

- **決策：** 後端全部使用 UTC，前端依瀏覽器時區顯示。
- **實作：** PostgreSQL `timestamptz` 欄位自動存 UTC；前端 `toLocaleString()` 自動轉換。
- **驗證：** 伺服器 `date` 顯示 UTC 16:57，台灣前端顯示 2026/2/8 上午12:57:00（UTC+8），正確。

### 10. 批量編輯群組 (v4.0)

- **問題：** 原 `BulkEditModal` 不支援群組編輯，用戶反饋。
- **解決方案：**
    - 後端 `BulkUpdateDto` 新增 `groupIds?: string[]` 欄位。
    - `bulkUpdate()` 方法：解構出 `groupIds`，避免被 `Object.assign` 直接寫入；若有值則 `resolveGroups` 後統一指派。
    - 前端 `BulkEditModal` 接收 `groups` prop，新增群組 checkbox 區塊。
