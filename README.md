# Open Context Forge Article Publisher

将已经审稿的 Open Context Forge 文章导出到 apframework.com、微信公众号编辑器素材包或通用 Markdown。仓库根目录的 [SKILL.md](SKILL.md) 是 Agent 入口；[设计](docs/design.md) 说明边界与交付阶段。

Node.js 20+，无运行时依赖。示例：

```bash
node scripts/publish.mjs --project /absolute/path/to/writing-project --channel generic-md --json
node scripts/publish.mjs --project /absolute/path/to/writing-project --channel apframework --blog-root /absolute/path/to/blog --slug english-slug --json
npm test
```

脚本只生成本地文件或写入指定博客仓库。上线需完成目标渠道的构建、编辑器操作或部署，并核对公开链接。
