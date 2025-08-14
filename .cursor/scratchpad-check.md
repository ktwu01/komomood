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
