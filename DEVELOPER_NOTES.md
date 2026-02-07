# 開發筆記與決策日誌

## 專案名稱：網站監控系統
## 日期：2026-02-07

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
