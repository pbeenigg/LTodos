# Ltodos (待办事项应用)

基于 NestJS 和 React 构建的全栈待办事项应用。

## 功能特性

- **用户认证**: 支持注册和 JWT 登录。
- **任务管理**: 创建、更新、删除任务。支持子任务、优先级设置和状态管理。
- **团队协作**: 创建团队并添加成员，在团队内分享任务。
- **任务历史**: 追踪任务的所有变更记录。
- **提醒与重复任务**: 自动发送任务提醒及生成重复任务。
- **Docker 支持**: 支持 Docker 容器化部署。

## 技术栈

- **前端**: React, TypeScript, Tailwind CSS, Zustand, Axios.
- **后端**: NestJS, TypeORM, PostgreSQL, Passport, Swagger.
- **数据库**: PostgreSQL.

## 快速开始

### 前置要求

- Node.js (v18+)
- Docker & Docker Compose
- pnpm

### 开发环境设置

1. **启动数据库**:
   ```bash
   docker-compose up -d postgres
   ```

2. **后端设置**:
   ```bash
   cd backend
   pnpm install
   pnpm start:dev
   ```
   后端 API 将运行在 `http://localhost:3000`。
   API 文档 (Swagger) 可访问 `http://localhost:3000/api`。

3. **前端设置**:
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```
   前端应用将运行在 `http://localhost:5173`。

### 部署

使用 Docker 部署完整技术栈：

```bash
docker-compose up --build -d
```

- 前端访问地址: `http://localhost:8080`
- 后端访问地址: `http://localhost:3000`

## API 文档

请访问 `http://localhost:3000/api` 查看交互式 Swagger 文档。
