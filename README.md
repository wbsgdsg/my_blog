# My Blog

Astro + Content Collections + GitHub Pages 的个人作品博客。

## 本地开发

```bash
npm install
npm run dev
```

## 构建检查

```bash
npm run build
```

## 修改个人资料

编辑：

```txt
src/content/profile/me.json
```

头像图片放到 `public/` 下，然后在 `avatar` 字段里填写文件名，例如：

```json
{
  "avatar": "/avatar.svg"
}
```

## 新增作品

在 `src/content/works/` 下新增一个 JSON 文件，例如：

```txt
src/content/works/my-new-work.json
```

内容示例：

```json
{
  "title": "新作品",
  "category": "web",
  "summary": "按钮里显示的一句话简介。",
  "detail": "点击按钮后显示的作品详情。",
  "tags": ["Astro", "Portfolio"],
  "links": [
    {
      "label": "GitHub",
      "url": "https://github.com/yourname/project"
    }
  ],
  "featured": false,
  "order": 4
}
```

每新增一个作品配置文件，页面都会自动生成一个对应按钮。

## 新增学习笔记

在 `src/content/notes/` 下新增一个 JSON 文件：

```json
{
  "title": "今天学到的东西",
  "date": "2026-05-09",
  "summary": "按钮里显示的一句话简介。",
  "content": "点击按钮后显示的笔记正文。",
  "tags": ["CSS", "复盘"],
  "order": 1
}
```

## 部署到 GitHub Pages

1. 把项目推送到 GitHub。
2. 打开仓库 Settings -> Pages。
3. Source 选择 `GitHub Actions`。
4. 推送到 `main` 或 `master` 分支后，`.github/workflows/deploy.yml` 会自动构建并发布。
