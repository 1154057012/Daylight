# 心晴 Daylight

情绪日记与自我关怀网页应用。

在线访问：https://1154057012.github.io/Daylight/

## 已实现

- 情绪日记：新增、编辑、删除、草稿、日历、搜索与筛选。
- 本地洞察：7/30 日走势、情绪分布、事件关联、分练习反馈统计。
- 关怀工具：呼吸、文字冥想、原创合成音乐与环境音、轻运动、暂停与反馈。
- 数据管理：JSON 备份恢复、CSV 导出、清空确认，个人与示例 IndexedDB 隔离。
- 响应式页面、键盘操作、减少动效偏好。

记录仅存于当前浏览器，每个空间最多 5 MB 数据，支持导出备份。音频由应用实时合成，无外链音频或第三方音频版权依赖。AI 模型与云端同步尚未接入，界面明确说明本地统计与规则推荐。

## 本地开发

需要 Node.js 22 或更高版本。

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

浏览器测试使用本机 Microsoft Edge。CI 执行单元测试与构建，通过后发布到 GitHub Pages。浏览器端到端检查在本地执行。

## 发布

GitHub Pages Source 设置为 GitHub Actions。推送 main 后 `.github/workflows/deploy.yml` 自动检查、构建并部署 dist。Vite 基础路径 `/Daylight/`，使用 HashRouter 避免静态托管子路径刷新问题。

不应将用户数据、模型密钥或 `.env` 文件提交到仓库。
