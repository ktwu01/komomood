# komomood – 可爱优雅粉色系「心情日记」

一个简洁优雅的情侣心情打卡网站（自托管后端 + SQLite），以 GitHub 贡献图风格展示每日心情记录。

## 🌸 特性（当前）

- **优雅粉色主题**: 采用渐变粉色设计，温馨浪漫
- **GitHub 风格热力图**: 使用 Cal‑Heatmap 展示最近一年 + 14 天的日历热图（右侧多两列）
- **响应式设计**: 完美适配移动端和桌面端
- **本地后端 API**: 前端读写 `/komomood/api/entries`，支持重复日期覆盖提交

## 📊 数据与后端

线上运行时数据存储在 `backend/mood_entries.db`（SQLite），表 `mood_entries`。也提供本地 JSON 作为开发回退：

```json
[
  {
    "date": "2025-01-15",
    "kokoMood": 4,
    "momoMood": 5,
    "komoScore": 4,
    "note": "一起看电影，很开心的一天"
  }
]
```

### 字段说明（前端/回退 JSON）

- `date`: 日期，格式为 YYYY-MM-DD
- `kokoMood`: Koko 的心情评分 (1-5)
- `momoMood`: Momo 的心情评分 (1-5)
- `komoScore`: 关系评分 (1-5)
- `note`: 可选的备注文字

## 🎨 颜色说明

热力图使用 5 级颜色渐变（蓝→粉）：

- Level 0 (无数据): `#E5E7EB` (灰色)
- Level 1: `#3B82F6` (蓝色)
- Level 2: `#60A5FA` (浅蓝)
- Level 3: `#A78BFA` (紫色)
- Level 4: `#F472B6` (粉色)
- Level 5: `#EC4899` (深粉)

颜色级别由 `komoScore` 决定，代表当天的关系质量。

## 🚀 本地开发

由于浏览器的 CORS 限制，需要使用本地服务器：

```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve .

# 或使用 PHP
php -S localhost:8000
```

然后访问 `http://localhost:8000`

后端（可选）：

```bash
cd backend
npm i
node server.js # 或使用 pm2 托管
```

## 📱 部署（当前线上）

- 静态资源：Nginx 提供 `/komomood/`（部署至 `/var/www/komomood/`）
- API 反代：`/komomood/api/` → `http://localhost:3002/api/`
- 访问：`https://us-south.20011112.xyz/komomood/`

## 🔧 维护与说明

- 生产不依赖外部 CDN：Cal‑Heatmap、Tailwind 等均使用本地构建/资产
- 数据库文件已纳入版本控制（特殊需求场景）。谨慎对待可能的体积与隐私问题
- 热力图额外 +14 天：如需调整，修改前端 `numWeeks` 计算

## 💕 关于

这是一个为情侣设计的私密心情记录工具，用简洁的方式记录和回顾美好时光。

---

Made with 💖 for Koko & Momo
