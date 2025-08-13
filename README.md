# komomood – 可爱优雅粉色系「心情日记」

一个简洁优雅的情侣心情打卡网站，以 GitHub 贡献图风格展示每日心情记录。

## 🌸 特性

- **优雅粉色主题**: 采用渐变粉色设计，温馨浪漫
- **GitHub 风格热力图**: 以日历形式展示最近一年的心情数据
- **响应式设计**: 完美适配移动端和桌面端
- **简单易用**: 静态网站，部署在 GitHub Pages 上

## 📊 数据格式

心情数据存储在 `data/entries.json` 文件中，格式如下：

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

### 字段说明

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

## 🚀 使用方法

### 添加新记录

1. 编辑 `data/entries.json` 文件
2. 按照上述格式添加新的记录
3. 提交更改到 GitHub

### 本地开发

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

## 📱 部署

项目托管在 GitHub Pages 上，任何推送到 `main` 分支的更改都会自动部署。

访问地址：`https://ktwu01.github.io/komomood/`

## 🔮 未来计划

- [ ] Google Forms 集成，实现在线提交
- [ ] GitHub Actions 自动同步表单数据
- [ ] 更多统计功能
- [ ] 数据导出功能

## 💕 关于

这是一个为情侣设计的私密心情记录工具，用简洁的方式记录和回顾美好时光。

---

Made with 💖 for Koko & Momo
