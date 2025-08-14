
# Komomood 应用重构计划

## 1. 背景与动机

原架构 (`前端 -> Google Sheet -> GitHub Action -> JSON 文件`) 脆弱且难以维护。为提升系统可靠性、可扩展性并实现数据自托管，我们将迁移至一个更健壮的架构：`前端 -> 本地后端 API -> 本地数据库`。

整个应用将部署在当前 Ubuntu 服务器上，并通过 `https://us-south.20011112.xyz/komomood/` 对外提供服务。

注意！不应该部署在 https://20011112.xyz/komomood/。因为当前 Ubuntu 服务器配置的domain是https://us-south.20011112.xyz/。

## 2. 关键挑战

- **后端开发**: 使用轻量级技术栈（如 Node.js + Express）创建一个简单、稳健的后端 API。
- **数据库设置**: 设计并初始化一个本地数据库（如 SQLite）来存储情绪数据。
- **数据迁移**: 将现有 `data/entries.json` 的数据安全、无损地迁移到新数据库。
- **前端重构**: 调整前端代码，使其与新的本地后端 API 进行通信。
- **Web 服务器配置**: 配置 Nginx 或其他 Web 服务器，使其能正确地：
  - 在 `/komomood/` 路径下提供前端静态文件。
  - 将 API 请求（如 `/api/*`）反向代理到后端服务。

## 3. 项目计划与状态看板

### 第一阶段：后端搭建与数据迁移

- [✅] **任务 1.1: 搭建基础后端服务**
  - **目标**: 选择并搭建一个基础的后端 API 服务器。
  - **技术选型**: Node.js + Express.js
  - **完成标准**: 后端服务能成功启动，并提供一个健康检查接口（如 `/api/health`），访问该接口返回成功状态。
  - **当前状态**: ✅ 已完成 - 服务器在端口 3001 成功启动，健康检查接口正常工作

- [✅] **任务 1.2: 集成 SQLite 数据库**
  - **目标**: 在后端项目中集成 SQLite 数据库。
  - **表结构 `mood_entries`**:
    - `id`: `INTEGER` (主键,自增)
    - `entry_date`: `TEXT` (唯一, 格式 'YYYY-MM-DD')
    - `koko_mood`: `INTEGER`
    - `momo_mood`: `INTEGER`
    - `komo_score`: `INTEGER`
    - `note`: `TEXT`
    - `created_at`: `TEXT` (默认 `CURRENT_TIMESTAMP`)
  - **完成标准**: 后端服务启动时能自动连接（或创建）数据库文件，并创建 `mood_entries` 表。
  - **当前状态**: ✅ 已完成 - SQLite3 依赖已安装，database.js 文件已创建，服务器启动时成功初始化数据库和表结构

- [ ] **任务 1.3: 实现 CRUD API 接口**
  - **目标**: 创建用于管理情绪记录的增、删、改、查（CRUD）API 接口。
  - **核心接口**:
    - `GET /api/entries`: 获取所有情绪记录。
    - `POST /api/entries`: 新增一条情绪记录。
  - **完成标准**: 所有 API 接口功能正确，并通过工具（如 curl 或 Postman）测试。

- [✅] **任务 1.4: 解决端口冲突**
  - **目标**: 修改后端服务配置，使用一个新的、未被占用的端口。
  - **技术选型**: 端口 `3002`。
  - **完成标准**: 后端服务能成功在端口 `3002` 启动。
  - **当前状态**: 已将 `backend/server.js` 中端口改为 `3002`，同步更新了 `backend/test-server.js`，并移除了 `process.stdin.resume()` 以避免后台挂起问题。

- [CANCELED] **任务 1.5: 迁移历史数据**
  - **目标**: 无需导入历史数据，项目将从零开始。
  - **完成标准**: 无。

### 第二阶段：前端改造与部署

- [ ] **任务 2.1: 重构前端数据逻辑**
  - **目标**: 修改前端 JavaScript (`app.js`)，使其通过新后端 API 存取数据。
  - **完成标准**: 页面能正确展示数据库中的所有记录，并能成功提交新记录。

- [✅] **任务 2.2: 配置 Web 服务器 (Nginx)**
  - **目标**: 配置 Nginx 实现应用的访问路由。
  - **当前状态**: ✅ 已完成 - 静态资源已从 `/var/www/komomood/` 提供；新增 `/komomood/api/` 反代至 `http://localhost:3002/api/;`；外部访问健康检查 200。
  - **配置要点**:
    - `location /komomood/`: 指向 `/var/www/komomood/`，`index index.html;`，`try_files $uri $uri/ =404;`。
    - `location /komomood/api/`: 反向代理到后端 Node.js 服务（`http://localhost:3002/api/;`）。
  - **完成标准**: 通过 `https://us-south.20011112.xyz/komomood/` 能成功访问应用，且 `https://us-south.20011112.xyz/komomood/api/health` 返回 200。

- [ ] **任务 2.3: 配置后端服务持久化**
  - **目标**: 确保后端服务能在服务器重启后自动运行。
  - **推荐工具**: `pm2` 或 `systemd`。
  - **完成标准**: 后端服务被进程管理工具接管，并设置为开机自启。

## 4. 执行者反馈区

### 当前进展
- ✅ **任务 1.1 已完成**: 后端服务已在端口 3001 成功启动，并通过健康检查。
- ✅ **任务 1.2 已完成**: SQLite 数据库集成成功，数据库文件和 mood_entries 表已创建。
- ✅ **Nginx 配置完成**: 已成功配置反向代理，将 `https://us-south.20011112.xyz/api/` 的请求转发至后端服务。
- ✅ **远程访问验证通过**: 已从外部网络成功访问 `/api/health` 端点，确认端到端连接正常。
- ✅ **任务 1.4 已完成（代码层面）**: 端口切换至 `3002`，并修复了可能导致进程挂起的 `stdin` 问题。
- ✅ **静态资源迁移**: 已将前端静态文件迁移至 `/var/www/komomood/` 并设置 `www-data` 可读，`https://us-south.20011112.xyz/komomood/` 返回 200。
- ✅ **Nginx 路由更新**: 已将 `location /komomood/` 的 `alias` 更新为 `/var/www/komomood/`，并新增 `location /komomood/api/` 反代至 `http://localhost:3002/api/;`；配置测试 `nginx -t` 通过并已 reload。
- ✅ **API 健康检查通过**: 后端重启后，本地与外部 `.../komomood/api/health` 均返回 `{status:'ok'}`（当前 PID 已更新）。

### 待解决问题
- **关键问题: Nginx 权限不足**
  - **现象**: 访问 `https://us-south.20011112.xyz/komomood/` 返回 403 Forbidden 或 404 Not Found。Nginx 错误日志显示 `stat() "/root/komomood/" failed (13: Permission denied)`。
  - **原因**: Nginx 的工作进程以 `www-data` 用户身份运行，出于安全限制，它没有权限访问 `/root` 目录下的文件。
  - **解决方案**:
    1. **推荐**: 将前端静态文件（整个 `komomood` 项目或仅前端部分）移动到标准的 Web 根目录，如 `/var/www/komomood`。
    2. **不推荐**: 强行修改 `/root` 目录的权限，这会带来严重的安全风险。
  - **决策**: 采用推荐方案，将项目部署到 `/var/www/` 目录下。
- **状态**: 已解决（静态资源已迁移至 `/var/www/komomood` 并验证 200）。
- **配置不一致: Nginx 仍反代到 3001**
  - **现状**: `/etc/nginx/sites-available/clipboard` 中 `location /api/` 仍为 `proxy_pass http://localhost:3001/api/;`。
  - **需要**: 更新为 `http://localhost:3002/api/;`。
- **状态**: 已解决（为避免与 `clip` 冲突，新增独立前缀 `/komomood/api/` → `3002`）。
- **静态目录指向受限路径**
  - **现状**: `location /komomood/ { alias /root/komomood/; }`。
  - **需要**: 指向 `/var/www/komomood/` 并确保 `www-data` 可读。
- **状态**: 已解决（`alias /var/www/komomood/;` 已生效）。
\- **新问题: `/komomood/api/health` 返回 504**
  - **状态**: 已解决（重启后端进程后恢复，外部与本地健康检查 200）。

### 下一步执行计划
**执行任务 2.2 (修正): 配置 Web 服务器 (Nginx) 并解决权限问题**
- **目标**: 将项目文件迁移到标准 Web 目录，并更新 Nginx 配置以正确提供前端服务。
- **步骤**:
  0. 仅在确认后，先停止当前占用 `3002` 的任何 Node 进程（仅限本项目相关）。
  1. 创建新的项目目录：`sudo mkdir -p /var/www/komomood`。
  2. 同步项目文件至 `/var/www/komomood/`：`sudo rsync -a --delete /root/komomood/ /var/www/komomood/`。
  3. 调整所有权：`sudo chown -R www-data:www-data /var/www/komomood`（或至少确保静态资源可读）。
  4. 更新 Nginx 配置：
     - 将 `location /komomood/` 的 `alias` 更新为 `/var/www/komomood/`。
     - 将 `location /api/` 的 `proxy_pass` 更新为 `http://localhost:3002/api/;`。
  5. `sudo nginx -t && sudo systemctl reload nginx`，验证 `https://us-south.20011112.xyz/komomood/`。
  6. 使用进程管理（后续任务 2.3）守护后端服务。

【追加】
7. 已完成：重启后端进程，`/komomood/api/health` 外部与本地均返回 200，API 可用。

## 5. 经验教训

### 问题 1: Node.js 服务器进程立即退出
**现象**: 无论是 Express 服务器还是原生 HTTP 服务器，Node.js 进程都会在启动后立即退出（Exit 1），导致无法访问 API 端点。

**尝试的解决方案**:
- 从 Express 5.x 降级到 Express 4.x
- 添加 process.stdin.resume() 保持进程活跃
- 使用原生 HTTP 模块替代 Express
- 添加错误处理和调试日志

**解决方案**: 发现问题是端口冲突 (EADDRINUSE)，端口 3000 已被占用。改用端口 3001 后问题解决。

### 问题 2: 重要环境注意事项
**关键教训**: 不要使用 `pkill -f node` 等命令杀死所有 Node.js 进程，因为 Cursor IDE 也依赖 Node.js，这可能会断开与服务器的连接。

**安全做法**: 只杀死特定的进程 ID，或使用不同的端口来避免冲突。

### 问题 3: Nginx 反向代理配置
**关键教训**: 在配置 Nginx 反向代理时，`proxy_pass` 指令末尾的 `/` 非常重要。
- `proxy_pass http://localhost:3001;`: 将 `/api/health` 转发为 `http://localhost:3001/api/health`。
- `proxy_pass http://localhost:3001/;`: 将 `/api/health` 转发为 `http://localhost:3001/health`。
根据后端路由的设计，我们需要第一种方式来保留 `/api` 前缀。

### 问题 4: Nginx 文件权限问题
**关键教训**: Web 服务器（如 Nginx）的工作进程通常以一个低权限用户（如 `www-data`）运行，以增强安全性。因此，Web 应用的文件必须存放在该用户有权访问的目录下。将项目文件放在 `/root` 等受限目录中会导致 "Permission Denied" 错误。
**标准做法**: 将 Web 项目部署在 `/var/www/` 或 `/srv/` 等标准目录中，并为项目文件设置正确的所有权和权限。

### 问题 5: 端口冲突
**关键教训**: 在部署新应用时，必须检查服务器上已有的服务，确保新应用使用的端口没有被占用。本次部署中，`komomood` 应用尝试使用的端口 `3001` 与现有应用 `@https://us-south.20011112.xyz/clip/` 的后端服务冲突，导致 `EADDRINUSE` 错误和一系列的启动问题。
**解决方案**: 为 `komomood` 后端服务选择一个明确未被占用的新端口（例如 `3002`），并在 Nginx 反向代理配置中同步更新。

### 问题 6: 端口监听但无响应（假死）
**现象**: 进程监听 `3002`，但健康检查超时（504/本地超时）。
**解决方案**: 重启后端进程恢复。后续建议使用进程管理工具（如 `pm2`）以实现守护与自动重启。

## 6. 安全进程审计与清理计划（仅规划，不执行）

- **目标**: 在不影响现有 `clip` 应用（`https://us-south.20011112.xyz/clip/`）的前提下，识别并清理与 `komomood` 无关或已僵死的进程，释放端口 `3002`。
- **已知事实**:
  - `clip` 前端通过 Nginx 提供，反代到 `localhost:3000/`。
  - `clip` 的 API 通过 Nginx 提供，反代到 `localhost:3001/api/`。
  - `komomood` 后端目标端口为 `3002`（代码已切换）。
  - 参考页面: [`clip`](https://us-south.20011112.xyz/clip/)。
- **不应终止的进程**:
  - 监听 `3000`、`3001` 的 Node 进程（属于 `clip`）。
  - Nginx、自身系统服务。
- **需要清理的候选**:
  - 监听 `3002` 的 Node 进程，且工作目录在 `(/root|/var/www)/komomood`，或命令行包含 `backend/server.js`。

- **审计步骤（只读）**:
  1. 列出监听端口（3000/3001/3002）：
     ```bash
     ss -tulpn | grep -E ':3000|:3001|:3002'
     ```
  2. 针对每个 PID，采集元数据：
     ```bash
     ps -o pid,user,cmd -p <PID> | sed -n '2p'
     readlink /proc/<PID>/cwd || true
     tr '\0' ' ' < /proc/<PID>/cmdline || true
     ```
  3. 归类：
     - 若端口为 `3000/3001` → 标记为 `clip`，禁止终止。
     - 若端口为 `3002` 且 `cwd` 或 `cmdline` 指向 `komomood` → 标记为 `komomood`，允许进入“候选终止列表”。

- **清理步骤（需确认后执行）**:
  - 对“候选终止列表”逐个执行：
    ```bash
    kill <PID> || true; sleep 1; kill -9 <PID> || true
    ```
  - 再次验证 `3002` 已释放：
    ```bash
    ss -tulpn | grep ':3002' || echo 'port 3002 free'
    ```

- **成功标准**:
  - `clip` 访问与 API 均不受影响。
  - 端口 `3002` 处于空闲状态，为 `komomood` 后端启动做好准备。

## 7. Nginx 路由隔离与更新（避免与 clip 冲突）

- **问题**: 当前虚拟主机中 `/api/` 指向 `localhost:3001/api/;`（为 `clip` 使用），不应复用给 `komomood`。
- **方案**:
  - 保留现有 `/clip/` 与 `/api/`（供 `clip` 使用）。
  - 为 `komomood` 增加独立路由前缀：
    - 静态：`/komomood/` → `alias /var/www/komomood/`（迁移后）。
    - API：`/komomood/api/` → `proxy_pass http://localhost:3002/api/;`。

- **建议的 Nginx 片段（仅供参考，需人工比对后修改）**:
  ```nginx
  location /komomood/ {
      alias /var/www/komomood/;
      index index.html;
      try_files $uri $uri/ =404;
  }

  location /komomood/api/ {
      proxy_pass http://localhost:3002/api/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```

- **变更后验证**:
  - `nginx -t` 通过，reload 成功。
  - `https://us-south.20011112.xyz/clip/` 正常。
  - `https://us-south.20011112.xyz/komomood/` 可访问静态资源。
  - `https://us-south.20011112.xyz/komomood/api/health` 返回 `{status: 'ok'}`。
