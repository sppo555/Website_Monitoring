# Website_Monitoring_Project/backend-ts/Dockerfile
# 階段 1: 構建
FROM node:20-alpine AS builder

WORKDIR /app

# 複製依賴文件並安裝
COPY package*.json ./
RUN npm install

# 複製所有源碼
COPY . .

# 執行 NestJS 編譯
RUN npm run build

# 階段 2: 生產運行
FROM node:20-alpine AS production

WORKDIR /app

# 複製生產依賴
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist

# 暴露 NestJS 埠
EXPOSE 3000

# 設定環境變數 (資料庫配置)
ENV POSTGRES_USER=user
ENV POSTGRES_PASSWORD=password
ENV POSTGRES_DB=monitoring_db
ENV POSTGRES_HOST=db # 假設在 Docker Compose 網路中

CMD [ "node", "dist/main" ]