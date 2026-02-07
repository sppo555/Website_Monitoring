# Website_Monitoring_Project/backend-ts/Dockerfile
# 階段 1: 構建
# 使用標準 node 鏡像以確保包含必要的工具
FROM node:20 AS builder 

WORKDIR /app

# 複製並安裝依賴
COPY package*.json ./
RUN npm install

# 複製所有源碼和啟動腳本
COPY . .
COPY check-db.sh /usr/local/bin/check-db.sh
RUN chmod +x /usr/local/bin/check-db.sh

# 執行 NestJS 編譯
RUN npm run build

# 階段 2: 生產運行
FROM node:20 AS production

WORKDIR /app

# 複製生產依賴
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /usr/local/bin/check-db.sh /usr/local/bin/check-db.sh
# 安裝 psql client
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*


# 暴露 NestJS 埠
EXPOSE 3000

# 設定環境變數 (資料庫配置)
ENV POSTGRES_USER=user
ENV POSTGRES_PASSWORD=password
ENV POSTGRES_DB=monitoring_db
ENV POSTGRES_HOST=db

# 使用啟動腳本延遲啟動
CMD ["/usr/local/bin/check-db.sh", "db", "node", "dist/main"]