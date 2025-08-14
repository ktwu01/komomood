
# Komomood 应用重构计划

## 1. 背景与动机

当前架构 (`前端 -> Google Sheet -> GitHub Action -> JSON 文件`) 脆弱且难以维护。我们将迁移至一个更现代、健壮的架构：`前端 -> 后端 API (Supabase) -> 数据库 (Postgres)`。此举旨在实现单一事实来源（Single Source of Truth），提升系统的可靠性和可扩展性。

## 2. 关键挑战

- **数据库设计**: 为情绪记录设计新的数据表结构。
- **数据迁移**: 将现有 `data/entries.json` 的数据安全地迁移到新数据库。
- **前端重构**: 修改前端应用，使其通过新的 API 接口与后端通信。
- **安全加固**: 为 API 添加用户认证，保障数据安全。

## 3. 项目计划与状态看板

### 第一阶段：后端搭建与数据迁移

- [ ] **任务 1.1: 创建 Supabase 项目**
  - **目标**: 在 Supabase 平台创建一个新项目，获得数据库和 API 服务。
  - **完成标准**: 成功创建项目，并获取到项目 URL 和 `anon` public API Key。

- [ ] **任务 1.2: 设计并创建 `mood_entries` 数据表**
  - **目标**: 根据 `data/entries.json` 的结构，在 Supabase 数据库中创建相应的数据表。
  - **表结构 `mood_entries`**:
    - `id`: `bigint` (主键)
    - `created_at`: `timestamp with time zone` (默认 `now()`)
    - `entry_date`: `date` (唯一)
    - `koko_mood`: `smallint`
    - `momo_mood`: `smallint`
    - `komo_score`: `smallint`
    - `note`: `text`
  - **完成标准**: 数据表在 Supabase 控制面板成功创建，字段与约束正确。

- [ ] **任务 1.3: 迁移现有数据**
  - **目标**: 将 `data/entries.json` 文件中的所有历史数据导入到新的 `mood_entries` 表中。
  - **完成标准**: `mood_entries` 表中的数据条数与 JSON 文件中的条目数一致。

### 第二阶段：前端应用重构

- [ ] **任务 2.1: 集成 Supabase SDK 到前端**
  - **目标**: 更新 `index.html` 和 `app.js`，使用 Supabase JS 客户端来获取和提交数据。
  - **完成标准**: 前端页面能够成功展示数据库中的所有情绪记录，并能成功提交新的记录。旧的 Google Sheet 相关逻辑被完全移除。

## 4. 执行者反馈区

*此区域将在执行阶段更新，用于记录进展、问题或请求协助。*

## 5. 经验教训

*此区域将记录项目中遇到的问题及其解决方案，以备未来参考。*