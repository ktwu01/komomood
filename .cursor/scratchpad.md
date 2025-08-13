# Project: komomood – 可爱优雅粉色系「心情日记」(Koko × Momo)

## Background and Motivation
- 目标：做一个简单、优雅、粉色系的情侣心情打卡网站，展示每天的「koko mood、momo mood、komo 关系分值」，以 GitHub 提交日历风格（contribution heatmap）呈现。
- 托管：部署到 GitHub Pages（免费、稳定、方便分享）。
- 约束：GitHub Pages 仅支持静态网站，不支持服务器端后端或数据库。
- 风格：Elegant pink（优雅粉色），遵循below的 HTML/CSS 要求（Tailwind CDN，响应式，小量 JS，图标库）。
```
# HTML/CSS 专家
## HTML/CSS
我需要创建一个[具体描述你的页面/组件类型]，请帮我生成美观且响应式的HTML+CSS代码。

## 设计参考
我希望设计风格类似于以下参考：
[上传参考图片或描述设计灵感来源]

## 技术要求
- 请使用HTML、TailwindCSS和少量必要的JavaScript
- 引用Tailwind CSS（v3.0+）通过CDN
- 页面需完全响应式，在移动设备和桌面端都能良好显示

## 图片资源
- 请使用Unsplash API提供的图片作为内容图片 (https://source.unsplash.com/...)
- 根据内容主题选择合适的关键词

## 图标要求
- 使用Font Awesome或Material Icons等专业图标库 (通过CDN引用)
- 避免使用emoji作为图标替代品

## 交互细节
[描述任何需要的交互动画或效果，例如：]
- 按钮悬停时有轻微放大效果
- 表单输入框聚焦时显示渐变边框
- 卡片在悬停时有阴影加深效果

## 特别注意
- 确保代码干净且有适当注释
- 提供完整可运行的HTML文件，包含所有必要引用
- 优化视觉层次和间距，确保设计美观专业
　
```

## Key Challenges and Analysis
1. GitHub Pages 不支持数据库/后端。
   - 方案A（最简）：采用静态 JSON 存储数据（`data/entries.json`），前端 JS 渲染。由我们手动更新 JSON（或网页上点按钮跳转到 GitHub 新建 Issue，之后自动聚合）。
   - 方案B（半自动）：使用 GitHub Issues 作为“数据输入”，通过 GitHub Actions 将 Issues 聚合为 `entries.json`（定时/手动触发），前端拉取该 JSON。
   - 方案C（第三方后端）：Supabase/Firebase/Google Sheets API（更复杂，非 v1）。
2. 隐私与访问控制。
   - 公开访问，暂不考虑域名与访问控制（后续如需再评估）。
3. 可视化与配色。
   - 需要 5 级渐变色（蓝 → 粉）用于映射 mood/关系分值。热力图按周列、周内行（GitHub 贡献图布局）。
4. 简洁实现。
   - 单页应用：`index.html` + `styles.css`（可选）+ `app.js` + `data/entries.json`，Tailwind 走 CDN，零构建即可部署。
5. 无重定向一键提交（不跳转 Google Form）。
   - 直接 POST 到 Google Form `formResponse` 需 `no-cors` 或隐藏 iframe，无法获知成功与错误详情，体验与可靠性一般（不推荐长期使用）。
   - 最佳实践：使用 Google Apps Script（GAS）Web App 暴露 `doPost` 端点写入 Google Sheet，前端 `fetch` 后就地提示成功/失败；继续用 Actions 聚合为 `entries.json`。

参考资料（@web）：
- GitHub Pages 静态托管与限制（仅静态，无后端）— 官方文档：Creating a GitHub Pages site / About GitHub Pages。
- 使用第三方保护静态站点访问：Cloudflare Access。
- GitHub Issues 预填参数与 Actions 聚合 JSON：Issues 表单、Actions 工作流、gh api。

## Product Scope (v1)
- 单页 Dashboard：
  - 顶部：标题、简介、优雅粉色主题、图标。
  - 渐变 legend（5 级，蓝→粉），标注 1–5 等级。
  - GitHub 风格热力图（显示最近 12 个月），单元格颜色由 `komoScore`（或合成分）驱动。
  - Hover/点击单元格弹出当天详情（koko、momo、komo 分值与备注）。
  - 顶部右上角提供“去打卡”入口：
    - v1.1 更新：点击按钮在站内弹出表单卡片（modal/card），填写 `date/kokoMood/momoMood/komoScore/note`，提交时构造 Google Form 预填链接并跳转到 Google Form 仅做最终确认与提交。
- 数据源：`data/entries.json`（手工维护，或后续接入 Actions 自动生成）。

## Data Schema (JSON)
```json
[
  {
    "date": "2025-08-12",
    "kokoMood": 1,
    "momoMood": 4,
    "komoScore": 3,
    "note": "一起散步，心情不错"
  }
]
```
- 映射策略 v1：热力图颜色使用 `komoScore`。
- 可选合成：`combined = Math.round((kokoMood + momoMood + 2*komoScore)/4)` 决定颜色强度。

## Color and UI Spec
- 渐变 5 级（蓝→粉），建议：
  - Level 1: `#3B82F6` (blue-500)
  - Level 2: `#60A5FA` (blue-400)
  - Level 3: `#A78BFA` (violet-400)
  - Level 4: `#F472B6` (pink-400)
  - Level 5: `#EC4899` (pink-500)
- Level 0（无数据）：`#E5E7EB` (gray-200 / 边框淡灰)
- 设计：浅粉背景、白色卡片、圆角、轻阴影；移动端横向滚动周列，桌面端显示完整 52 周。

## Algorithms (Display)
- 时间布局：
  - 起点：今日向前 365 天；按周分组（每列 7 行：周日顶至周六底，与 GitHub 一致）。
  - 若某天无数据，则显示 Level 0；有值时 `level = clamp(komoScore, 1, 5)`。
- 交互：
  - Hover/点击显示 tooltip/弹层，展示当天三项分值与 note。

## Architecture Decision
- v1 采用 方案A：纯静态 JSON（最简单、最稳）。
- v1.1 可选：Issues 预填 + Actions 聚合 JSON。
- 隐私如需：接入 Cloudflare Access。

## High-level Task Breakdown (Planner)
1) 初始化与仓库
- 创建仓库 `komomood`，启用 Pages（from `main` / `/`）。
- 成功标准：`https://<username>.github.io/komomood/` 显示占位页。

2) 前端基础骨架
- 文件：`index.html`、`app.js`、`data/entries.json`（示例数据）。
- 成功标准：页面加载无错误，读取 JSON 并在控制台打印条目数。

3) 颜色与 Legend
- 实现 5 级颜色 legend（蓝→粉），样式优雅，含数值标签。
- 成功标准：legend 在移动/桌面端对齐、响应式良好。

4) 热力图网格（近 12 个月）
- CSS Grid 实现 52 列 × 7 行，映射 `komoScore` → 颜色级别。
- 成功标准：最近一年日期正确落格；空缺为灰；有值按色阶。

5) 交互与详情
- Hover/点击显示当天详情（koko/momo/komo/note）。
- 成功标准：有数据格子能显示详情，无数据显示“暂无打卡”。

5a) 新增通行码输入与校验（passphrase, MMDD）
- 表单新增输入框：占位符“MMDD”，辅助文案“通行码（2024MMDD 中的后四位）”。
- 校验：正则 `^\d{4}$`，错误时阻止提交并提示。
- 成功标准：输入不合规时明确提示；合规时可与其他字段一起提交。

6) “打卡入口”与数据维护
- v1：按钮链接到仓库 `data/entries.json`（Edit）；附 README 说明数据格式。
- 成功标准：能通过网页引导，手动追加数据并生效。

6b) 无重定向一键提交（推荐）：GAS Web App
- 后端：在同账户下创建 GAS 项目，`doPost` 写入 Google Sheet（含 passphrase 校验），返回 `{ ok: true|false, error? }`，并设置 CORS 头。
- 前端：改为 `fetch(webAppUrl, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...}) })`，根据返回值显示成功/失败状态，不跳转。
- 成功标准：提交后留在本页，显示“提交成功/失败”；失败有清晰错误信息，支持重试。

6c) 备选（应急）：隐藏 iframe + Google Form `formResponse`
- 风险：无回执、易受风控，不作为长期方案。
- 成功标准：表面上不跳转，数据最终进入表单（仅应急测试用）。

7) 部署与校验
- 推送 `main`，验证 Pages 生效与样式正常。
- 成功标准：线上可见，移动端/桌面端视图无样式错乱。

8) 可选增强（Later）
- Issues 预填链接：`https://github.com/<owner>/<repo>/issues/new?title=...&body=...`
- Actions：定时/手动把 Issues 转 `entries.json` 并提交回仓库。
- Cloudflare Access：如需私密访问。

## Project Status Board
- [x] 1 仓库创建与 Pages 启用
- [x] 2 提交基础骨架（`index.html` / `app.js` / `data/entries.json` 示例）
- [x] 3 (UI Fix) 修正热力图布局与对齐（已实现，待你视觉确认）
- [x] 4 (UI Fix) 修正 Legend 与标签对齐（已实现，待你视觉确认）
- [ ] 5 实现交互详情（tooltip/弹层）
- [ ] 5 实现交互详情（tooltip/弹层）
- [ ] 6 “打卡入口”改为站内表单卡片（modal）→ 构造 Google Form 预填链接（modal 已完成，待提供 Google Form 预填映射以打通提交流程）
- [ ] 7 Pages 部署验证

## UI/UX Fixes and Refinements (v1.1)
- **Heatmap Grid Orientation**: 热力图应为**竖向**排列（从上到下，再从左到右），以符合 GitHub 风格。当前为横向。
  - **Fix**: 在 `heatmap-grid` 的 CSS 中，添加 `grid-auto-flow: column;`。
- **Label Alignment**:
  - **Legend Alignment**: `Less/More` 标签、`0-5` 数字和色块需精确对齐。
  - **Day Label Alignment**: `Sun-Sat` 星期标签需与热力图的行精确对齐。
  - **Month Label Alignment**: `Jan-Dec` 月份标签需与热力图的列大致对齐。
  - **Fix**: 使用更精细的 Flexbox 或 Grid 布局来控制标签位置，而不是依赖于简单的 `space-x` 或 `justify-between`。

## On-page Check-in Modal Spec
- **触发**: 点击顶部“去打卡”按钮后，打开居中弹层（Card/Modal）。
- **字段**:
  - date (YYYY-MM-DD, 必填，默认今天)
  - kokoMood (1–5, 必填，步进 1)
  - momoMood (1–5, 必填，步进 1)
  - komoScore (1–5, 必填，步进 1)
  - note (可选，最多 140 字)
  - passphrase（必填，4 位数字，格式 MMDD；提示“2024MMDD 的后四位”）
- **校验**: 必填项非空，分值范围 1–5，日期格式校验。
  - passphrase：正则 `^\d{4}$` 校验；错误时高亮输入并在表单顶部显示错误。
- **提交行为**（二选一）：
  - A 已有：Google Form 预填跳转（零后端，可靠）
  - B 推荐：GAS Web App 直传（无重定向，返回 JSON，前端就地提示成功/失败）
- **UI/交互**:
  - Modal 支持 Esc/遮罩点击关闭
  - 移动端全宽卡片；桌面端圆角卡片，淡入淡出动画
  - 成功提交后，回到页面可提示“稍后将同步到可视化（由工作流更新）”
- **依赖**:
  - 需要提供 Google Form live URL（非编辑链接）或“获取预填链接”的样例 URL 以提取各字段的 `entry.<ID>` 映射

### Google Form 预填映射说明
- 打开 Google Form → 右上角三点 → 获取预填链接（Get pre-filled link）
- 随便填入样例值 → 生成预填链接 → 复制该链接
- 在链接参数中找出每个问题对应的 `entry.<数字>`，记录为：
  - date → entry.X1
  - kokoMood → entry.X2
  - momoMood → entry.X3
  - komoScore → entry.X4
  - note → entry.X5
- 执行器将把页面表单值映射到上述参数并跳转

## Current Status / Progress Tracking
- 规划阶段完成：确认 v1 使用静态 JSON；设计数据 schema、色阶、布局与任务拆分。
- **Executor 已完成基础骨架提交。**
- **Planner 根据用户反馈，新增了 UI/UX 修正任务。**
- **Executor 已提交并推送 GitHub Actions 工作流与 CSV→JSON 转换脚本（可在 Actions 手动运行）。**
- **UI 修正（热力图方向、Legend/日/月标签）已实现，等待你在页面上确认效果。**
- **交互详情完善（待你确认）**：已新增移动端友好的 tooltip 行为（单元格点击/触摸可锁定展示，点击空白处关闭；鼠标移开在未锁定时自动隐藏）。若效果符合预期，请确认后我再在任务板勾选完成。
- **“去打卡”站内表单（modal）已实现，已填入 Google Form 预填映射与暗号；可直接从页面提交并在新标签页打开 Google Form 进行确认。**
 - **GAS Web App 已成功部署（Version 3）**：`https://script.google.com/macros/s/AKfycbw16RHR1LWne6DQXYLBWdSEMRLQLQcZWXfZy77GjktRcYabwIYUarMIHOprPg6U-XAImw/exec`。下一步：前端接入直传（urlencoded，无预检）并在页面提示提交结果。

## Executor's Feedback or Assistance Requests
- 如需私密访问，请确认是否采用 Cloudflare Access（需要域名与 DNS 变更）。
NO

- 如需网页表单直填，建议 v1.1 采用 Issues + Actions；是否需要我先行搭好 Actions（使用默认 GITHUB_TOKEN 权限）？
YES. what should i do?

- 请确认两点：
  1) `GF_CSV_URL` 是否为 CSV 导出直链格式：`https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=csv&gid=<GID>`（你提供的编辑链接对应 gid=0，则导出为 `.../export?format=csv&gid=0`）。
  2) 提供 Google Form 的 live URL 与一条“获取预填链接”的样例 URL，以便我提取各字段的 `entry.<ID>` 并填入 `app.js` 的 `googleFormConfig`。

- 是否同意我现在提交并推送以下新增文件：
  - `.github/workflows/sync-form.yml`
  - `.github/scripts/csv_to_entries.js`
  推送后你即可在 GitHub Actions 手动触发并验证 `entries.json` 是否更新。

## Lessons
- GitHub Pages 仅静态；数据可放仓库 JSON 或来自 Issues，经 Actions 聚合。
- 遵循：Read the file before edit；未经许可不进行 git push。
- **教训**: CSS 布局中的对齐问题，不能仅靠 `space-between` 或 `justify-center`，需要更精确的容器和尺寸计算来保证对齐。热力图的渲染方向需要特别注意 `grid-auto-flow` 属性。

## Hosting & Data Input Options
- 目标：公开访问 + 简单打卡输入 + 可长期稳定
- 采用方案：Google Forms → Google Sheet → GitHub Actions 拉取并写入 `data/entries.json`（免登录提交）

（其余备选方案暂不考虑，后续若有需要再加入对比）

### 表单与数据字段
- Google Form 字段（全部中文/英文均可，建议如下）：
  - date（日期，必填，Date 类型，格式 YYYY-MM-DD）
  - kokoMood（整数 1–5，必填）
  - momoMood（整数 1–5，必填）
  - komoScore（整数 1–5，必填）
  - note（可选，短文本）
- 表单设置：允许任何持有链接者提交（免登录）。
- 回答目的地：关联到 Google Sheet，第一行即为列头（需与上述字段一一对应，或后续在转换脚本里做字段映射）。

### Google Sheet CSV 导出链接
- 将 Sheet 共享权限设为“Anyone with the link can view / 任何知道链接的人可查看”。
- CSV 导出链接形式（两种常见）：
  - `https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=csv&id=<SHEET_ID>&gid=<GID>`
  - `https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv&sheet=<SHEET_NAME>`
- 建议把 CSV 链接写入仓库 Secret：`GF_CSV_URL`。

### 聚合与转换（GitHub Actions）
- 新增工作流文件：`.github/workflows/sync-form.yml`（由 Executor 实施）
  - 触发：
    - `workflow_dispatch`（手动触发）
    - `schedule: '0 3 * * *'`（每天 03:00 UTC 拉取）
  - 步骤：
    - Checkout 仓库
    - `curl -L "$GF_CSV_URL" -o data/sheet.csv`
    - 运行转换脚本将 `data/sheet.csv` → `data/entries.json`（字段标准化、类型校验、去重）
    - 若文件有更改则提交（使用 `git-auto-commit-action` 或 `git` 命令）
- 转换脚本：`.github/scripts/csv_to_entries.(js|py)`（由 Executor 实施）
  - 逻辑：
    - 解析 CSV 行为对象：`{ date, kokoMood, momoMood, komoScore, note }`
    - 类型校验与截断：将分值 clamp 到 1–5
    - 去重策略：按 `date` 分组，取最后一条为当天有效记录（latest-wins）
    - 输出 JSON 数组，按 `date` 升序/降序（前端任意都可）
    暗号：0317。
  - 可选过滤：若表单里增加“passphrase”字段（固定暗号），脚本仅保留暗号正确的记录；暗号值放 Repo Secret：`GF_PASSPHRASE`

### 前端配合
- 在页面明显位置放“去打卡”按钮，直接跳转 Google Form 链接。
- 前端仍从 `data/entries.json` 加载数据并渲染热力图/legend/详情弹层。

### 时区与日期
- 表单存的是纯日期（无时间），不涉时区转换；
- Actions 拉取与前端渲染仅按日期字符串对齐（YYYY-MM-DD）。

### 防滥用（可选，v1.1 再加）
- 表单增加一题“暗号”并放宽提示，仅你们二人知道；转换脚本验证暗号。
- 若仍担心泛滥，可换成 Cloudflare Turnstile + 自建轻量 API（复杂度上升）。

### 成功标准（本方案）
- 在 GitHub 仓库中存在并可被 Pages 访问到的 `data/entries.json`；
- 手动触发工作流后数分钟内，`entries.json` 被最新表单数据更新；
- 页面“去打卡”按钮能打开表单并成功提交；
  或切换到“无重定向一键提交”，提交后留在本页并显示成功/失败提示；
- 热力图正常展示最新 12 个月数据，颜色映射与详情正确。

### Project Status Board（补充小任务）
- [x] 创建 Google Form（含 date/koko/momo/komo/note 字段）并绑定 Sheet
- [x] 开启 Sheet 公共只读，拿到 CSV 导出链接并保存为仓库 Secret：`GF_CSV_URL`
- [x] 新增 `.github/workflows/sync-form.yml`（手动 + 定时触发）
- [x] 新增 `.github/scripts/csv_to_entries.(js|py)` 转换脚本
- [ ] 在页面加“去打卡”站内表单（modal），并在提交时跳转到 Google Form 预填链接（等待 `entry.<ID>` 映射）
- [ ] 首次工作流运行成功，仓库内 `data/entries.json` 更新
 - [ ] 新增 passphrase 输入框（MMDD）与前端校验
  - [x] （推荐）部署 GAS Web App 端点（doPost）写入 Sheet，返回 JSON（已部署：`https://script.google.com/macros/s/AKfycbw16RHR1LWne6DQXYLBWdSEMRLQLQcZWXfZy77GjktRcYabwIYUarMIHOprPg6U-XAImw/exec`）
  - [ ] 前端切换为直传（GAS，使用 `application/x-www-form-urlencoded` 以避免预检），提交后就地提示成功/失败（不跳转）
 - [ ] 备选：隐藏 iframe + Google Form `formResponse`（仅应急）
  - 成功标准：
    - passphrase 输入框在移动与桌面均显示良好，错误格式有明确提示
    - GAS 端点返回 `{ ok: true }` 时，页面显示“提交成功”；返回 `{ ok:false, error }` 时显示错误并可重试
    - Actions 运行后，`data/entries.json` 包含新记录，前端热力图更新

## Repository Secrets（for GitHub Actions）
- 位置：GitHub 仓库 → Settings → Security → Secrets and variables → Actions → New repository secret
- 必需
  - GF_CSV_URL：Google Sheet 的 CSV 导出直链
    - 示例格式：`https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=csv&gid=0`
    - 用途：`.github/workflows/sync-form.yml` 中 `curl -L "$GF_CSV_URL" -o data/sheet.csv`
- 可选
  - GF_PASSPHRASE：例如 `0317`
    - 用途：在转换脚本中过滤无效行（`.github/scripts/csv_to_entries.js` 通过 `process.env.GF_PASSPHRASE` 使用）

注意
- 不要把实际的密钥或私有链接提交进代码库；仅通过 Secrets 配置。
- GAS Web App URL 为公网可访问端点，属于公开信息，不需要放入 Secrets（前端会直接调用）。

验证
- 在 Actions 里手动运行“Sync Google Form to entries.json”工作流：
  - 步骤“Download CSV from Google Sheet”应成功且无“GF_CSV_URL secret is not set”错误。
  - 步骤“Convert CSV to entries.json”应输出“Wrote N entries…”，并在后续步骤中触发自动提交 `data/entries.json`。

## Executor's Feedback or Assistance Requests（更新）

### ✅ Completed: GAS Frontend Integration 
- **前端集成已完成**：
  - ✅ 新增 passphrase 输入框（MMDD 格式，正则校验 `^\d{4}$`）
  - ✅ 实现直接提交到 GAS（使用 `application/x-www-form-urlencoded` 避免预检）
  - ✅ 添加成功/失败 UI 反馈（提交后显示结果，不跳转）
  - ✅ 保留 Google Form 作为备用方案（如果 GAS 失败会自动降级）

### 🟡 **待用户修复：GAS 脚本缺少函数**
- **发现问题**：通过 curl 测试 GAS 端点时返回错误：`{"ok":false,"error":"ReferenceError: clamp_ is not defined"}`
- **原因**：您的 GAS 脚本可能缺少 `clamp_` 函数定义
- **解决方案**：请在您的 GAS 脚本中确保包含完整的代码，特别是这个函数：
```javascript
function clamp_(n) {
  n = Number(n);
  if (!isFinite(n)) return null;
  return Math.max(1, Math.min(5, Math.trunc(n)));
}
```

### 📝 待处理任务
- 修复 GAS 脚本后，前端将能够成功提交数据到 Google Sheet
- 运行 GitHub Actions 同步工作流以验证数据流程
- 测试完整的端到端流程：前端 → GAS → Sheet → Actions → entries.json → 可视化更新

## Architecture Decision（更新）
- 数据输入采用“站内表单体验 + Google Form 预填确认”的混合方案：前端仅做 UI 与参数构造，不直接写入仓库；后端仍通过 Google Sheet → GitHub Actions 聚合生成静态 JSON，保持静态站点的稳定性与可维护性。
- v1.1 推荐路线：增加 GAS Web App（无重定向一键提交、返回 JSON），与既有 Actions 流程兼容。

## GAS Web App Implementation Guide（Step-by-step）
前置：确保 Google Sheet 已建立并用于 Actions 聚合（第一行作为表头，建议列：`date, kokoMood, momoMood, komoScore, note, passphrase, createdAt`）。

1) 创建与授权
- 方式A（推荐）：打开目标 Google Sheet → 扩展程序 → Apps Script（作为绑定脚本）。
- 方式B：访问 script.new 创建独立脚本项目（需在代码里用 `SpreadsheetApp.openById('<SHEET_ID>')` 指向表格）。

2) 粘贴脚本（示例）
```javascript
// Replace SHEET_ID and SHEET_NAME accordingly
const SHEET_ID = 'PUT_YOUR_SHEET_ID';
const SHEET_NAME = 'Sheet1';
const ALLOW_ORIGIN = '*'; // 可改为 'https://ktwu01.github.io' 或你的 Pages 域名

function doPost(e) {
  return handleRequest_(e);
}

function doGet(e) {
  return json_({ ok: true, service: 'komomood', ts: new Date().toISOString() });
}

function handleRequest_(e) {
  try {
    // 为避免预检（OPTIONS），前端使用 application/x-www-form-urlencoded
    var params = e && e.parameter ? e.parameter : {};
    var date = String(params.date || '').slice(0, 10);
    var koko = clamp_(params.kokoMood);
    var momo = clamp_(params.momoMood);
    var komo = clamp_(params.komoScore);
    var note = String(params.note || '');
    var pass = String(params.passphrase || '').trim();

    // 简单校验：passphrase 固定 '0317' 或 MMDD 四位
    var passOk = pass === '0317' || /^\d{4}$/.test(pass);
    if (!date || !koko || !momo || !komo) return json_({ ok: false, error: 'invalid_payload' });
    if (!passOk) return json_({ ok: false, error: 'invalid_passphrase' });

    var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActive();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    sh.appendRow([date, koko, momo, komo, note, pass, new Date()]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function clamp_(n) {
  n = Number(n);
  if (!isFinite(n)) return null;
  return Math.max(1, Math.min(5, Math.trunc(n)));
}

function json_(obj) {
  var out = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  out.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  out.setHeader('Access-Control-Allow-Methods', 'POST, GET');
  out.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return out;
}
```

3) 部署为 Web App
- 菜单：部署 → 新部署 → 选择“网络应用程序”。
- 说明：Execution as = Me（我），Who has access = Anyone。
- 部署后复制 Web App URL（形如 `https://script.google.com/macros/s/.../exec`）。
 - 已部署（用户提供）：`https://script.google.com/macros/s/AKfycbw16RHR1LWne6DQXYLBWdSEMRLQLQcZWXfZy77GjktRcYabwIYUarMIHOprPg6U-XAImw/exec`（Version 3，2025-08-13 08:28）

4) 前端集成（避免预检）
- 使用 `application/x-www-form-urlencoded` 发送，避免 CORS 预检：
```js
// const webAppUrl = '你的 Web App URL';
const params = new URLSearchParams({
  date, kokoMood, momoMood, komoScore, note, passphrase
});
await fetch(webAppUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
  body: params.toString(),
});
// 返回体为 JSON（GAS 端），前端可 .json() 解析并提示 ok/错误
```

5) 验证流程
- 使用 curl 或 Postman 先测通：
```bash
curl -X POST -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'date=2025-01-15&kokoMood=4&momoMood=5&komoScore=4&note=test&passphrase=0317' \
  'https://script.google.com/macros/s/XXXX/exec'
```
- 确认 Google Sheet 新增行；随后手动触发 Actions，查看 `data/entries.json` 更新；本地或 Pages 端刷新热力图验证。

6) 安全与防滥用（基础）
- 在脚本中将 `ALLOW_ORIGIN` 设为你的 Pages 域名。
- 前端与 GAS 双端校验字段与分值范围；必要时增加速率限制或 Turnstile。
- 如果后续需要密钥，可考虑在 GAS 校验自定义 token；当前场景下 passphrase 足够。

## Google Form Setup Guide（Step-by-step）
1) 创建表单（forms.google.com）
- 新建空白表单，命名为：komomood Check-in
- 添加问题（全部设为 Required/必填，除 note 外）：
  - date：类型建议“Short answer/简答”，开启响应验证（正则）：^\\d{4}-\\d{2}-\\d{2}$，提示“YYYY-MM-DD”
  - kokoMood：类型“Short answer/简答”，数字 1–5 验证（最小 1，最大 5）
  - momoMood：同上（1–5）
  - komoScore：同上（1–5）
  - note：类型“Paragraph/段落”，可选，最大 140 字（描述里提示）
- 说明：将 date 设为“简答”便于预填生成单一的 entry.<ID> 参数；若使用“日期”类型，Google 会拆成 entry.<ID>_year/_month/_day，前端需特别处理。

2) 设置与分享
- 在“设置”中关闭“收集邮箱”等限制；允许任何持有链接者提交
- 右上角“发送”→ 复制“表单链接”（用户真实填写入口）

3) 关联 Google Sheet
- 顶部切到“回复”→ 连接到表格 → 创建新表格
- 打开该表格，右上角“共享”→ 设为“Anyone with the link can view”

4) 获取 CSV 导出直链（供 Actions 使用）
- 访问该表格后，记录地址栏中的 SHEET_ID
- 选中目标工作表（通常第一个，gid=0），形成：
  - https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=csv&gid=0
- 将该链接写入仓库 Secret：GF_CSV_URL

5) 获取 Google Form 预填链接并提取映射
- 表单编辑页 → 右上角三点 → 获取预填链接（Get pre-filled link）
- 用示例值填一遍（date=2025-01-15；koko/momo/komo=1–5；note=测试）→ 点击“获取链接”→ 复制
- 预填链接（实际）示例：
  - https://docs.google.com/forms/d/e/1FAIpQLSf8XZ0Wp3NgCKBAbBY63KTC6wzyTnfa0sYZFYH7CQHZ1iffXA/viewform?usp=pp_url&entry.171852347=2025-08-13&entry.1537924001=5&entry.1625555189=2&entry.1362123046=5&entry.1162583406=0317
- 记录：
  - prefillBaseUrl：保留到 viewform?usp=pp_url，去掉所有 entry.* 参数
  - fieldMap（已填入 app.js）：
    - date → entry.171852347
    - kokoMood → entry.1537924001
    - momoMood → entry.1625555189
    - komoScore → entry.1362123046
    - note → entry.103218744
  - optional.passphrase：entry.1162583406，值 0317（已在前端自动附加；Actions 侧也可用 GF_PASSPHRASE 过滤）
- 若 date 使用“日期”类型，会出现 entry.<ID>_year/_month/_day 三个参数；可回到第 1 步改为“简答+正则”，或告知我 3 个参数名，我将调整 `app.js` 以适配。

6) 可选：增加“暗号/passphrase”题
- 类型：Short answer，提示输入固定值，例如“0317”，并设为必填
- 在 GitHub Secrets 设置 GF_PASSPHRASE=0317，Actions 会过滤不匹配的行

7) 成功标准
- 提交一条真实表单 → 等待 Actions 手动/定时运行 → 仓库 `data/entries.json` 更新
- 页面加载显示最新记录，tooltip 展示正确
