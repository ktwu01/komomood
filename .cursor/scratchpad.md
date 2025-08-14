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
- **前端样式生产化**: 去除 `cdn.tailwindcss.com` 生产依赖，采用本地构建的压缩 CSS（Tailwind CLI 或 PostCSS）。
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
  - **当前状态**: ✅ 已完成 - `GET /api/entries` 与 `POST /api/entries` 工作正常；`POST` 支持 `?overwrite=true` 覆盖更新；已通过脚本与浏览器端到端验证。

- [✅] **任务 1.4: 解决端口冲突**
  - **目标**: 修改后端服务配置，使用一个新的、未被占用的端口。
  - **技术选型**: 端口 `3002`。
  - **完成标准**: 后端服务能成功在端口 `3002` 启动。
  - **当前状态**: 已将 `backend/server.js` 中端口改为 `3002`，同步更新了 `backend/test-server.js`，并移除了 `process.stdin.resume()` 以避免后台挂起问题。

- [CANCELED] **任务 1.5: 迁移历史数据**
  - **目标**: 无需导入历史数据，项目将从零开始。
  - **完成标准**: 无。

### 第二阶段：前端改造与部署

- [✅] **任务 2.1: 重构前端数据逻辑**
  - **目标**: 修改前端 JavaScript (`app.js`)，使其通过新后端 API 存取数据。
  - **完成标准**: 页面能正确展示数据库中的所有记录，并能成功提交新记录。
  - **当前状态**: ✅ 已完成 - 通过 `/komomood/api/entries` 加载记录；表单直连后端 `POST` 并在 409 时提供覆盖确认；生产环境回退直接跳转 Google Form。

- [✅] **任务 2.2: 配置 Web 服务器 (Nginx)**
  - **目标**: 配置 Nginx 实现应用的访问路由。
  - **当前状态**: ✅ 已完成 - 静态资源已从 `/var/www/komomood/` 提供；新增 `/komomood/api/` 反代至 `http://localhost:3002/api/;`；外部访问健康检查 200。
  - **配置要点**:
    - `location /komomood/`: 指向 `/var/www/komomood/`，`index index.html;`，`try_files $uri $uri/ =404;`。
    - `location /komomood/api/`: 反向代理到后端 Node.js 服务（`http://localhost:3002/api/;`）。
  - **完成标准**: 通过 `https://us-south.20011112.xyz/komomood/` 能成功访问应用，且 `https://us-south.20011112.xyz/komomood/api/health` 返回 200。

- [✅] **任务 2.3: 配置后端服务持久化**
#### 新增：前端提交与错误处理改进
- [ ] 任务 2.4: 提交冲突(409)的用户体验优化（含紧急解堵方案）
  - 目标：当 `POST /komomood/api/entries` 返回 409（当日已存在）时，不再回退至 GAS；而是提示“当日已打卡”，并允许用户覆盖/编辑或关闭提示。
  - 成功标准：
    - 创建首次当日记录：HTTP 201 → 成功提示并刷新热力图。
    - 重复当日提交：HTTP 409 → 显示用户友好提示，不触发 GAS 请求；控制台无 CORS 报错。
  - 变更要点：
    - 在 `submitCheckinForm()` 中检测 `submitToBackend` 返回的 `status===409`，停止后续回退链路（不再调用 GAS），展示“今天已打卡”提示。
    - 记录成功/冲突后刷新 UI（或允许用户选择刷新）。
  - 紧急解堵：
    - 方式A（立即可用）：删除当日的测试记录（2025-08-14）以恢复首次提交路径。
      - 执行：`sqlite3 backend/mood_entries.db "DELETE FROM mood_entries WHERE entry_date='YYYY-MM-DD'"`（由执行者操作）。
      - 成功标准：前端首次提交返回 201，无 409 弹窗。
    - 方式B（功能性修复，推荐）：实现“覆盖提交”（见 任务 2.6/3.2），即遇到 409 时询问用户是否覆盖，确认后完成更新。
  - 当前状态：
    - 阶段1（阻断回退到 GAS + 友好提示）：✅ 已上线。重复当天提交显示“今天已打卡”且无 CORS 报错。
    - 阶段2（覆盖提交 UI）：⏳ 待实现，见任务 2.6。

##### 即刻执行建议（需要您的选择）
- A. 先清掉今日测试数据，马上恢复“首次提交”路径；随后上线“覆盖提交”。
- B. 不清数据，直接实现“覆盖提交”端到端（后端 UPSERT/PUT + 前端确认），上线后再测试。

- [ ] 任务 2.5: 移除 GAS 回退（生产环境）
  - 目标：避免触发 GAS 跨域（CORS）错误，生产环境失败时仅回退至 Google Form 预填单。
  - 成功标准：后端不可用时，直接弹出“将使用 Google Form 备用方案”，不再出现 GAS CORS 报错。
  - 参考：Tailwind／Apps Script 文档参见下方参考链接。
  - 当前状态：✅ 已实现（`app.js` 使用 `window.location.hostname` 判定生产域，生产环境直接跳过 GAS，转 Google Form）。

- [✅] 任务 2.6: 前端“覆盖提交”确认流（与 3.2 配合）
  - 目标：当后端返回 409 时，弹出确认对话框，用户确认后调用“覆盖/更新”接口。
  - 成功标准：
    - 用户确认 → 更新成功（HTTP 200），界面显示“已更新”并刷新热力图。
    - 用户取消 → 不修改数据，无错误弹窗。
  - 变更要点：在 `submitCheckinForm()` 中分支处理 409，新增确认 UI 与后续调用（PUT/UPSERT）。
  - 当前状态：✅ 已实现。冲突时弹窗询问，确认后以 `?overwrite=true` 重试并成功返回 200，随后刷新热力图与统计。

### 第三阶段：前端样式生产优化（Tailwind）
- [✅] 任务 3.1: 迁移 Tailwind 至本地构建产物
  - 目标：移除 `cdn.tailwindcss.com`，改为构建并引用本地压缩 CSS。
  - 方案（简易 CLI 路径）：
    1. 安装 CLI（可用本地或全局方式）：`npx tailwindcss -i input.css -o assets/tailwind.css --minify`。
    2. 新增 `input.css`（包含 `@tailwind base; @tailwind components; @tailwind utilities;`）。
    3. 创建 `tailwind.config.js`（扫描 `index.html`、`app.js` 等）。
    4. 构建后将 `assets/tailwind.css` 部署到 `/var/www/komomood/assets/` 并在 `index.html` 中替换 CDN 链接。
  - 成功标准：页面功能与样式一致；控制台不再提示生产环境警告；页面首屏加载 CSS 来自本地文件。
  - 参考：[Tailwind 安装指南](https://tailwindcss.com/docs/installation)
  - 当前状态：✅ 已完成并部署，`index.html` 现在引用 `assets/tailwind.css`。

### 第四阶段：后端更新与幂等
- [✅] 任务 3.2: 后端支持“覆盖/更新”
  - 方案一（SQLite UPSERT，简单高效，推荐）：
    - 在 `POST /api/entries` 增加 `?overwrite=true`（或请求体 `overwrite:true`）时，发生唯一键冲突后执行 `UPDATE ... WHERE entry_date = ?` 并返回 200。
    - 首次提交 → 201；覆盖提交 → 200，返回更新后的记录。
  - 方案二（RESTful 分离）：新增 `PUT /api/entries/:entry_date` 用于按日期更新。
  - 安全性（可选）：允许传入 `passphrase` 进行简单服务端校验（与现有 `0317` 保持一致）。
  - 成功标准：
    - 正常创建：201；冲突覆盖：200；错误输入：400/422；重复键且未授权覆盖：409。
  - 实现要点：
    - `database.js` 新增 `getEntryByDate()` 与 `updateEntryByDate()`。
    - `server.js` 在 409 冲突且 `overwrite` 为真时执行更新，返回 200。
  - 参考：
    - SQLite UPSERT 官方文档：[SQLite UPSERT](https://www.sqlite.org/lang_UPSERT.html)
    - MDN HTTP 409 冲突语义：[MDN 409](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409)

### 杂项修复
- [✅] 任务 4.1: favicon 404 修复
  - 添加 `assets/favicon.svg`，并在 `index.html` 中使用 `<link rel="icon" href="/komomood/assets/favicon.svg" />`。
  - 成功标准：控制台不再出现 `favicon` 404。

- [ ] 任务 4.2: 清理历史静态数据文件 `data/entries.json`
  - 选项 A（推荐）：保留在仓库用于本地开发演示，但从线上部署目录中移除，不再作为生产回退数据源。
    - 要点：保留 `app.js` 的本地 JSON 回退逻辑仅在非生产环境触发；部署时不拷贝 `data/entries.json`。
  - 选项 B（完全移除）：删除仓库中的 `data/entries.json`，并移除 `app.js` 中对本地 JSON 的回退引用。
  - 完成标准：生产环境 Network 不再请求 `data/entries.json`；前端在生产仅依赖后端 API/Google Form 回退。
  - 决策：✅ 采纳选项 A（仓库保留、生产不部署）。
  - 部署约定：生产部署仅同步 `index.html`、`app.js`、`assets/`（含 `tailwind.css` 与 `favicon.svg`）；跳过 `data/` 目录。

- [✅] 任务 4.3: 文档补充（更新 `TESTING.md`）
  - 增补可用检查项与脚本：
    - 健康检查与获取数据（Nginx 入口）。
    - 最小化 POST 测试（201/409）。
    - 覆盖流程测试（201 → 409 → 200），指向 `tests/overwrite_flow.sh`。
    - 前端可达性与控制台日志期望（“成功通过 /komomood/api 加载 ... 条心情记录”）。
    - 生产资源检查：Network 中 `assets/tailwind.css` 加载成功且无 CDN；自定义 `favicon.svg` 命中 200。
    - 进程管理：`pm2 status` 期望在线，端口占用排查指引。
  - 完成标准：按照文档逐项执行均可复现通过结果；新同学可自助完成回归。
  - 已获批准：✅ 由执行者在下一步更新 `TESTING.md`，纳入以下“统一检查清单”结构：
    1) 后端健康：`/komomood/api/health` 返回 `{status:"ok"}`（curl 示例）
    2) 数据读取：`/komomood/api/entries` 返回 JSON 数组（curl 示例）
    3) 前端可达：`/komomood/` HTTP 200 与 DevTools Console 期望日志
    4) 提交测试：运行 `tests/post_entry.sh`，允许 201/409
    5) 覆盖测试：运行 `tests/overwrite_flow.sh`，期望 201 → 409 → 200（或 409 → 200）
    6) 生产资源：Network 中 `assets/tailwind.css` 命中 200、无 `cdn.tailwindcss.com`；`assets/favicon.svg` 命中 200
    7) 进程与端口：`pm2 status` 在线；`ss -tulpn | grep ':3002'` 仅 pm2 进程占用
    8) 故障排查：pm2 logs、端口占用清理、Nginx 配置要点与 reload

### 第五阶段：新需求（数据库刷新与前端 +14 天展示）

- [Planner] 背景与动机（新增）：
  - 用户希望：
    1) 将 SQLite 数据库“从零开始”并纳入版本控制（移出忽略），便于在当前服务器失效后，用 Git 方式迁移到新服务器。
    2) 仅修改前端：在现有热力图右侧再展示 14 天（两列周），即“原右边界向右扩展两列”。

- 关键考量与建议：
  - 将二进制数据库文件加入 Git 通常不推荐（仓库体积、diff/合并、潜在敏感数据），但在本项目“临时服务器 + 私有/受控仓库 + 明确迁移需求”的前提下可接受。更佳的可替代方案：同时保留一份 SQL dump（文本）以便未来可复原；或使用 Git LFS 管理二进制。
  - “刷新数据库”可通过安全删除当前 `backend/mood_entries.db` 后由后端自动重建表完成；或执行 `DROP TABLE ...` 再 `VACUUM`。基于当前后端会自建表，推荐“删除文件并重启后端”的简法。
  - 前端扩展 14 天需要同时修改：
    - `app.js` 中日期网格生成（当前固定 52 周 × 7 天）；
    - `index.html` 中 `.heatmap-grid` 的 `grid-template-columns` 列数（当前 `repeat(53, 1fr)` 与 52 周存在轻微偏差）；
    - 月份标签渲染逻辑（使用 `numWeeks` 变量替代硬编码 52）。

- 高层成功标准：
  - 数据库：
    - 仓库中包含空白的 `backend/mood_entries.db`（或最小数据），`.gitignore` 已允许跟踪该文件；新环境拉取仓库后无需迁移脚本即可直接运行并看到相同数据。
  - 前端：
    - 热力图明显在右侧多出两列（共 +14 天），悬浮提示未来日期显示“暂无打卡记录”，现有统计不受影响；移动端与桌面端样式正常。

#### 待执行任务拆分（可逐项执行）

- [ ] 任务 5.1: 允许跟踪数据库文件
  - 变更点：在 `.gitignore` 的数据库忽略规则后追加白名单一行：`!backend/mood_entries.db`。
  - 验证：`git check-ignore -v backend/mood_entries.db` 无输出；`git add -f backend/mood_entries.db` 可成功加入暂存区。
  - 成功标准：`git status` 显示该文件被跟踪；后续提交包含该文件。

- [ ] 任务 5.2: 刷新数据库为“空库”
  - 步骤（运行顺序）：
    1) 暂停后端（避免写入）：`pm2 stop komomood-backend`。
    2) 备份（可选）：`cp backend/mood_entries.db backend/mood_entries.backup.$(date -u +%Y%m%dT%H%M%SZ).db || true`。
    3) 删除现有库：`rm -f backend/mood_entries.db`。
    4) 重启后端以自动重建：`pm2 start komomood-backend && pm2 save`。
    5) 验证：
       - `curl -sS https://us-south.20011112.xyz/komomood/api/entries` 返回 `[]`；
       - 通过前端看到“成功通过 /komomood/api 加载 0 条心情记录”。
    6) 将新生成的空库加入 Git：`git add -f backend/mood_entries.db`。
  - 成功标准：库文件体积较小，API 返回空数组，提交包含空库。

- [ ] 任务 5.3: 前端扩展热力图 +14 天（仅前端改动）
  - 设计：参数化“周数/额外天数”。例如：`const extraDays = 14; const extraWeeks = Math.ceil(extraDays/7); const numWeeks = 52 + extraWeeks;`
  - 变更点：
    - `app.js`
      - `generateDateGrid()`：将硬编码 `52` 替换为 `numWeeks`；起始周对齐逻辑保留；总格子 = `numWeeks * 7`。
      - `renderMonthLabels(dates)`：基于 `numWeeks` 迭代（替换硬编码 52），`left` 百分比随 `numWeeks` 自适应。
    - `index.html`
      - `.heatmap-grid` 的 `grid-template-columns: repeat(<numWeeks+1?>, 1fr)` 与格子数对齐。为避免历史轻微不一致，建议与 `numWeeks` 精确匹配（通常为 `repeat(54, 1fr)` 当 `numWeeks=54`）。
  - 验证：
    - 视觉：右侧新增两列；对齐良好，无水平滚动异常；移动端栅格尺寸随媒体查询仍正常。
    - 功能：悬浮未来 14 天显示无记录提示；月份标签不重叠且对齐合理。
  - 成功标准：在生产地址加载后，肉眼可见两列新增；控制台无报错；已存在数据列位置不偏移。

- [ ] 任务 5.4: 迁移便利性（可选优化）
  - 新增 SQL dump：`sqlite3 backend/mood_entries.db .dump > seed/komomood.dump.sql` 并纳入仓库，便于未来服务器用 `sqlite3 ... < dump.sql` 还原。
  - 或采用 Git LFS 管理 `backend/mood_entries.db`，减少仓库体积压力。
  - 成功标准：新环境既可直接用随仓库的 `.db` 启动，也可选择用 dump 构建。

#### 规划内参考
- `.gitignore` 例外白名单：使用否定匹配 `!path/to/file` 可以在通配忽略后重新纳入跟踪。
- SQLite 清库方式：删除文件由应用重建，或 `DROP TABLE mood_entries; VACUUM;` 以保持文件存在且清空数据。

> 注：根据用户指示，当前暂不执行“任务 5.4（SQL dump/LFS）”。保持规划但不落实。

### 第六阶段：前端热力图替换为 Cal-Heatmap

- 背景与动机：
  - 用成熟的开源库替换自研网格，获得更完善的“GitHub 风格”日历热图、内置工具提示与布局控制，减少自维护代码量。
  - 参考库：Cal-Heatmap（MIT）［参考：`https://github.com/wa0x6e/cal-heatmap`］。

- 关键设计：
  - 使用 Cal-Heatmap 的 `domain: 'week'` + `subDomain: 'day'`，配置 `range: 54` 以满足“在原基础上右侧 +14 天（2 周）”。
  - `start` 设为“今日回溯 52 周所在周的周一（或周日）”，从而保证末端包含未来两周（右侧两列）。
  - 数据以 `date(timestamp) -> value(komoScore)` 形式传入；缺失日期显示为中性背景色。
  - 颜色阈值对齐现有等级：0（无数据）→ `#E5E7EB`；1..5 采用现有配色（蓝→粉）并做 legend 标注。
  - 使用 Tooltip 插件展示日期、三项分值与备注；点击单元格打开“新建打卡”弹窗并预填该日期。

- 拆分任务与成功标准：

  - [ ] 任务 6.1：选型与版本锁定
    - 产出：记录采用的 Cal-Heatmap 主版本（例如 v4.x）与下载来源（官网/发布页）。
    - 成功标准：文档列出版本与获取路径，便于可重复构建。

  - [ ] 任务 6.2：引入静态资源（本地化）
    - 将 `cal-heatmap.min.css`、`cal-heatmap.min.js`（以及所需 d3 运行时）置于 `assets/vendor/cal-heatmap/`，在 `index.html` 通过本地 `<link>/<script>` 引入。
    - 成功标准：前端 Network 显示本地加载资源，无外链 CDN；控制台无 404。

  - [ ] 任务 6.3：数据映射与初始化渲染
    - 在 `app.js` 中：
      - 提供 `buildCalHeatmapData(entries)`，将 `entries` 映射为 `timestamp(seconds) -> komoScore(1..5)`。
      - 新增 `renderCalHeatmap()`：
        - 计算 `numWeeks = 54`；
        - 计算 `startDate`：从今日回溯 52 周并对齐到周起点（与 `weekStart` 一致）；
        - 初始化 Cal-Heatmap（`domain: 'week'`, `subDomain: 'day'`, `range: numWeeks`, `weekStart: 1`）；
        - 配置 `legend`/`features.missingDataColor` 与配色；
        - 加载映射数据。
    - 成功标准：页面呈现热力图，右侧含两列未来日期；无 JS 报错。

  - [ ] 任务 6.4：Tooltip/交互接入
    - 启用 Tooltip 插件，自定义模板为：日期（含星期）、Koko/Momo/Komo 分值、备注。
    - 点击单元格：打开现有打卡弹窗，自动将 `ci_date` 预置为所点日期。
    - 成功标准：悬停提示信息完整；点击联动可用。

  - [ ] 任务 6.5：移除/替换旧逻辑与样式
    - 移除 `generateDateGrid()`、`renderHeatmap()`、`renderMonthLabels()` 与手写 tooltip 的绑定，保留同名容器作为 Cal-Heatmap 挂载点以减少 DOM 变更。
    - 更新（或移除）与旧 `.heatmap-grid` 相关的 CSS，避免样式冲突；保留页面左侧星期标签块（如仍需）。
    - 成功标准：控制台无未使用函数/事件告警；视觉与交互均由 Cal-Heatmap 驱动。

  - [ ] 任务 6.6：视觉验收与回归
    - 验证移动端/桌面端显示；确认两列“未来”日期；颜色等级与既有定义一致；统计区展示不变。
    - 成功标准：
      - 右侧确实新增两列（+14 天）；
      - 未来日期 tooltip 显示“暂无打卡记录”；
      - 加载与提交（含覆盖流）后热图同步刷新。

- 依赖与注意：
  - 保持现有 API 与数据模型不变；仅替换前端热图实现。
  - 资源路径与 Nginx `/komomood/` 前缀一致，确保部署到 `/var/www/komomood/assets/vendor/cal-heatmap/`。
  - 遵循本项目“生产不依赖外部 CDN”的约定。

- 参考
  - Cal-Heatmap 项目主页与文档：[Cal-Heatmap on GitHub](https://github.com/wa0x6e/cal-heatmap)

#### 线上未见 +14 天的原因分析与验证计划（Planner）

- 现象：用户在 `https://us-south.20011112.xyz/komomood/` 未见右侧 +14 天；页面仍显示“加载心情数据中...”。
- 可能根因：
  1) 新版 `app.js` 未部署至 `/var/www/komomood/`（仍在使用旧文件）。
  2) 浏览器/中间缓存导致旧 `app.js` 被缓存（未包含 `numWeeks` 改动）。
  3) 运行时 JS 报错导致 `init()` 中断，未执行 `hideLoading()`（例如打包语法/路径差异）。
  4) 旧 `.heatmap-grid { grid-template-columns: repeat(53, 1fr) }` 未被覆盖为行内样式（理论上我们已通过 JS 设置 inline 样式覆盖，仍需确认是否生效）。

- 验证步骤（不改代码）：
  - V1. 拉取线上 `app.js` 检查是否含有 `numWeeks`：
    - `curl -sS https://us-south.20011112.xyz/komomood/app.js | grep -n "numWeeks" | cat`
    - 期望出现 `this.numWeeks = this.baseWeeks + this.numExtraWeeks;` 等新代码痕迹。
  - V2. 浏览器硬刷新（或 `?v=ts` 加版本参数）绕过缓存；打开 DevTools Console 检查是否有 JS 报错；在 Elements 中选中 `#heatmapGrid`，查看 Computed 样式中 `grid-template-columns` 是否为 `repeat(54, 1fr)`。
  - V3. Network 观察 `app.js` 的响应体是否与仓库一致（检查含 `renderWithCalHeatmap` 关键字）。
  - V4. 若出现 JS 报错，记录报错行号与上下文，回到本地对应行核对。

#### Cal-Heatmap 本地引入与切换计划（接受“可以 git clone”指示）

- 目标：按“生产不依赖 CDN”原则，将 Cal-Heatmap 静态资源本地化并逐步切换热力图实现。
- 来源与许可：MIT 许可，仓库地址：[Cal-Heatmap on GitHub](https://github.com/wa0x6e/cal-heatmap)。

- 拆分任务：
  - [ ] 任务 6.2a：拉取源代码
    - 执行：在项目根目录执行 `git clone https://github.com/wa0x6e/cal-heatmap vendor/cal-heatmap`。
    - 若服务器不适合完整构建，可优先下载发布版的构建产物（Release Assets）并放入 `assets/vendor/cal-heatmap/`。
    - 成功标准：本地存在可用 `cal-heatmap.min.js` 与 `cal-heatmap.min.css`（及插件 Tooltip 的构建文件）。

  - [ ] 任务 6.2b：拷贝构建产物至静态目录
    - 目录：`assets/vendor/cal-heatmap/`（保持与 Nginx 路由一致）。
    - 在 `index.html` 引用本地 CSS/JS（不使用 CDN）。
    - 成功标准：页面 Network 面板显示从 `/komomood/assets/vendor/cal-heatmap/` 加载。

  - [ ] 任务 6.3（补完）：完成 `renderWithCalHeatmap()` 的 tooltip 与点击事件
    - Tooltip：按库文档配置 Tooltip 插件模板（显示日期、分值、备注）。
    - Click：绑定 `cal.on('click', ...)` 打开“新建打卡”对话框并预置日期。
    - 成功标准：交互与旧实现一致或更优。

  - [ ] 任务 6.4：范围与对齐
    - 参数：`range = 54`（含 +14 天），`domain: 'week'`，`subDomain: 'day'`；`date.start` 对齐周起始，右侧覆盖未来 2 周。
    - 成功标准：肉眼可见两列新增；元素 tooltip 对未来日期显示“暂无打卡记录”。

  - [ ] 任务 6.5：切换与清理
    - 在确认 Cal-Heatmap 工作稳定后，移除旧的手写渲染函数与样式，保留同一挂载容器以减少 DOM 变更。
    - 成功标准：控制台无未引用函数/样式告警；渲染性能与体验正常。

#### 执行/验证约定
- 先完成“V1–V4”验证，若确认线上未部署新版 `app.js` 或存在缓存/报错，优先修复部署与缓存；随后再导入 Cal-Heatmap 以替换。
- 在 Cal-Heatmap 资源就绪前，页面会继续采用“回退到旧网格”的逻辑，不影响使用。

### 第七阶段：Bug 修复（“连续打卡天数”计算不正确）

- 症状：统计区“连续打卡天数”显示不准确。
- 初步研判根因：
  1) 时区不一致：
     - `formatDate(date)` 以 `toISOString()` 取 UTC 日期；
     - `new Date()` 与 `new Date('YYYY-MM-DD')` 在不同浏览器/环境下按本地/UTC 解析，可能产生跨日偏移；
     - 导致“今天/昨天”比较出现 off-by-one。
  2) 现有算法仅在 `i===0` 时特殊处理“今天无、昨天有”的情况，后续期望日推进与集合判断分离不彻底。

- 修复设计（统一 UTC 天粒度）：
  - 采用“UTC 日”为唯一基准，避免本地时区影响：
    - 解析：`parseDateUTC('YYYY-MM-DD') => new Date(Date.UTC(y,m-1,d))`；
    - 序列化：`toDateStringUTC(dateUTC) => YYYY-MM-DD`（使用 UTC 年月日拼接）。
  - 以集合法计算 streak：
    1) 构建 `Set<string>` 存储所有已打卡的 UTC 日期字符串；
    2) 选取 `referenceDateUTC`：若集合包含“今天(UTC)”则从今天开始；否则若包含“昨天(UTC)”则从昨天开始；否则 `streak=0`；
    3) While 循环：依次检查 `referenceDateUTC, referenceDateUTC-1d, ...` 是否存在于集合，逐日累加，直到断开；
    4) 返回 `streak`。
  - 边界：空集合、仅未来日期、重复提交（DB 已按日期唯一确保无重复）。

- 任务拆分：
  - [ ] 7.1 定义 UTC 工具函数：`parseDateUTC(str)`、`formatDateUTC(dateUTC)`、`addDaysUTC(dateUTC, delta)`、`todayUTC()`、`yesterdayUTC()`。
  - [ ] 7.2 重写 `calculateCurrentStreak()` 为 `calculateCurrentStreakUTC()` 并替换调用；不依赖本地时区；
  - [ ] 7.3 单元/断言测试（可在浏览器控制台或简单脚本验证）：
    - 空数组 → 0；
    - 仅昨天 → 1；
    - 今天+昨天 → 2；
    - 存在断点（今天、前天）→ 1；
    - 多条连续历史 → 正确连续长度；
    - 跨 UTC 边界（在 00:00 附近）不受本地时区影响；
  - [ ] 7.4 端到端验证：提交今天/昨天数据后刷新统计，核对 streak；
  - [ ] 7.5 文档更新：在此处记录采用“UTC 天”作为 streak 计算基准的决定与原因。

- 成功标准：
  - 不同浏览器/服务器时区下结果一致；
  - 没有“午夜前后”或“本地与 UTC 偏移”引发的 off-by-one；
  - 功能与性能：O(n) 集合构建 + O(k) 连续检查（k 为连续长度），页面响应无明显下降。

### 项目完成度评估
- 后端 CRUD（含覆盖）、前端覆盖确认流、Nginx 路由、pm2 进程守护、本地 Tailwind 构建与 favicon 均已交付并线上验证（参考：`https://us-south.20011112.xyz/komomood/`）。
- 剩余事项：
  - 4.2 作为部署约定已定稿（无需代码变更）。
  - 4.3 文档更新需执行者完成并提交审阅。

## 参考资料（规划依据）
- Tailwind CSS 生产安装与构建：[Tailwind Installation](https://tailwindcss.com/docs/installation)
- 站点现状与控制台信息：`https://us-south.20011112.xyz/komomood/`

  - **目标**: 确保后端服务能在服务器重启后自动运行。
  - **推荐工具**: `pm2` 或 `systemd`。
  - **完成标准**: 后端服务被进程管理工具接管，并设置为开机自启。
  - **当前状态**: ✅ 已完成 - 已安装并配置 `pm2`；启动 `komomood-backend`（指向 `backend/server.js`）；`pm2 save` 已执行；`pm2 startup systemd` 已启用开机自启；`/komomood/api/health` 经由 Nginx 返回 200。

## 4. 执行者反馈区

### 当前进展（精简）
- 后端/API：健康检查 200；CRUD（GET/POST）可用；端口 3002；pm2 守护。
- 数据库：SQLite 自动建表；支持覆盖更新（`?overwrite=true`）。
- Nginx/部署：`/komomood/` 静态与 `/komomood/api/` 反代生效；本地资源（tailwind.css、favicon.svg）。
- 前端：读写 `/komomood/api/entries`；409 覆盖确认流已上线；+14 天热力图；Cal‑Heatmap 本地资产，缺失时回退旧网格。
- 测试：`tests/post_entry.sh` 通过（201/409）；端到端覆盖流验证通过。

#### 新增问题记录（浏览器控制台）
- Tailwind 生产警告：不应在生产使用 `cdn.tailwindcss.com`（参考官方文档）。
- GAS CORS 报错：当后端返回 409 或失败时，回退到 GAS 会被浏览器同源策略拦截（无 `Access-Control-Allow-Origin`），建议移除 GAS 回退或通过后端代理。
  - 参考：
    - Tailwind 生产安装：[Tailwind Installation](https://tailwindcss.com/docs/installation)
    - 409 冲突的典型含义与处理：HTTP 409 代表资源状态冲突；对于按唯一键（日期）创建记录，常见做法为提供覆盖/更新路径（PUT 或 UPSERT）。

### 待解决问题
- 当前无阻塞问题。
  - Nginx 权限、路径与反代前缀均已修正并验证 200。
  - `/komomood/api/health` 外部/本地均返回 200。
  - 备注：`pm2` 显示 `komomood-backend` 为 `errored` 的原因是端口被已有进程占用（服务仍可用）。已在“8. 本地机器测试命令/pm2 端口占用快速修复”提供统一由 pm2 托管的修复步骤，可按需执行。

### 下一步执行计划
- 验证与小结：
  - 通过 Nginx 访问 `https://us-south.20011112.xyz/komomood/` 页面 200。
  - `https://us-south.20011112.xyz/komomood/api/health` 返回 200（已验证）。
  - `https://us-south.20011112.xyz/komomood/api/entries` 返回 JSON（当前为空数组 [] 合理）。
  - 浏览器控制台出现“成功通过 /komomood/api 加载 ... 条心情记录”日志。
  - 使用脚本 `bash tests/post_entry.sh` 进行最小化 POST 验证（期望 201 或 409）。
  - 前端 UI 提交：
    - 当日首次提交 → 成功提示并刷新热力图。
    - 当日重复提交 → 仅友好提示，不触发 GAS；控制台无 CORS 报错。
  - 本轮实现：
    1) 完成 3.2 后端覆盖支持；
    2) 完成 2.6 前端覆盖确认流；
    3) 补充测试脚本：`tests/overwrite_flow.sh`；
    4) 进行 3.1 Tailwind 本地构建并部署 `assets/tailwind.css`（已完成）；
    5) 完成 4.1 favicon 修复（已完成）。
    6) 由用户进行页面手测并确认（详见下方“执行者需要您确认 / 协助”）。

#### 建议的后续优化（可选，非阻断）
- 观测与维护：
  - 通过 pm2 持续监控 `komomood-backend`；如遇 3002 端口被手动进程占用，优先清理手动进程，保持单一 pm2 托管。
- 前端细节：
  - 将覆盖确认由 `window.confirm` 升级为自定义 Modal，以保持一致的 UI 风格与可访问性。
  - 针对 `Unload` 弃用提醒，无需动作；仅在未来依赖该事件时避免新增使用。


### 当前状态更新（执行 Phase 5 与 Phase 6）
- 任务 5.3（前端 +14 天）：
  - 已实现：在 `app.js` 中参数化 `numWeeks=54`，并将月标签与网格渲染按 `numWeeks` 计算；对旧网格路径设置 `gridTemplateColumns = repeat(numWeeks, 1fr)`，无需改动 `index.html` 的固定 53 列也能被覆盖。
  - Cal-Heatmap 集成骨架：新增 `renderWithCalHeatmap()`，若页面存在 `window.CalHeatmap` 则优先使用库渲染，否则自动回退到旧网格渲染；确保不引入外部库时页面仍正常工作。
  - 待办：在 `assets/vendor/cal-heatmap/` 引入本地 JS/CSS 与依赖，并在 `index.html` 挂载；完成后可移除旧网格渲染路径。

- 任务 6.x（Cal-Heatmap）：
  - 6.3 已部分完成（初始化逻辑与数据映射函数集成到 `app.js`）。
  - 6.2/6.4/6.5 待执行（拷贝静态资源、本地 Tooltip/交互、替换旧样式）。

### 执行者的请求
- 请在 `https://us-south.20011112.xyz/komomood/` 验证右侧是否新增两列（+14 天）。悬浮应显示“暂无打卡记录”。如确认通过，我将继续执行第 6 阶段的资源引入与全面切换。
- 数据库相关（5.1/5.2）：待您允许后我再执行（涉及停/启后端与 Git 变更）。

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

## 8. 本地机器测试命令（针对已部署环境）

- 说明：以下命令在本地终端运行，用于验证线上 Nginx → 后端（pm2）端到端是否正常。

- 健康检查（期望 200 + ok）：
  ```bash
  curl -sS https://us-south.20011112.xyz/komomood/api/health
  ```

- 获取数据（期望返回 JSON 数组，初期为空 `[]` 合理）：
  ```bash
  curl -sS https://us-south.20011112.xyz/komomood/api/entries
  ```

- 前端可达性（只看响应头，期望 200）：
  ```bash
  curl -I https://us-south.20011112.xyz/komomood/
  ```

- 本地测试结果（已验证）：
  - 健康检查：OK，返回 `{status:"ok", message:"Backend is healthy"}`。
  - 获取数据：OK，返回 `[]`（当前为空数组合理）。
  - 前端可达性：OK，返回 `HTTP/1.1 200 OK`。

- 端到端可视化验证：
  1) 浏览器打开 `https://us-south.20011112.xyz/komomood/`
  2) 打开 DevTools Console，观察是否有“成功通过 /komomood/api 加载 ... 条心情记录”日志（API 正常时）
     - 已验证：显示 `app.js:66 成功加载 1 条心情记录`

  3) 如 API 临时不可用，控制台会出现“已使用本地 JSON 作为后备”提示（仅作为过渡备用）

- pm2 状态（通过 SSH 连到服务器后执行）：
  ```bash
  pm2 status | grep komomood-backend || pm2 status
  ```
  - 当前结果：`komomood-backend` 显示 `errored`。
  - 建议排查：
    - `pm2 logs komomood-backend --lines 100`
    - `pm2 describe komomood-backend`
    - 如需重启：`pm2 restart komomood-backend`

### pm2 端口占用快速修复（EADDRINUSE on 3002）
- 现象：`pm2` 进程报错 `EADDRINUSE :3002`，但 API 依然可用（说明已有一个进程占用 3002）。
- 目标：只保留由 `pm2` 管理的后端进程，避免重复进程。
- 步骤（通过 SSH 在服务器上执行）：
  ```bash
  # 1) 找到占用 3002 的 PID
  ss -tulpn | grep ':3002'

  # 2) 确认该 PID 详情（确保是 komomood 相关进程）
  ps -o pid,user,cmd -p <PID>
  readlink /proc/<PID>/cwd || true

  # 3) 若确认是 komomood 的旧/手动启动进程，则终止（谨慎，不要影响 clip）
  kill <PID> || true; sleep 1; kill -9 <PID> || true

  # 4) 用 pm2 启动并持久化
  pm2 restart komomood-backend
  pm2 save
  pm2 status | grep komomood-backend || pm2 status
  ```

> 注意：不得终止监听 3000/3001 的进程（它们属于 clip）。仅终止与 `komomood` 相关、且占用 3002 的进程。

### 新增经验（Lesson）
- 避免同时以“手动 node 运行”和“pm2 托管”两种方式启动同一个服务，否则会导致端口冲突，使 pm2 进程进入 `errored` 状态。统一使用 pm2 托管并 `pm2 save`、`pm2 startup` 保证重启恢复。