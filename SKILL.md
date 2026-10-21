---
name: open-context-forge-article-publisher
description: Use when publishing or exporting an already reviewed Open Context Forge article to apframework.com, a WeChat Official Account preparation package, or portable Markdown. Do not use for article drafting, vault ingestion, or knowledge compilation.
---

# Open Context Forge Article Publisher

把完成审稿的文章转为目标渠道可用的文件，并准确报告它到达的发布阶段。上游写作和知识编译由相应 skill 完成；这里读取成稿、核对公开性、处理图片和执行渠道交付。

## 选择成稿

- 用户指定文件时使用该文件。指定写作项目时，`scripts/publish.mjs` 按 `article.md`、`published.md`、`final.md` 顺序选稿。旧 vault `30-writing/published/` 仅在用户明确指定时使用。
- 未指定文章而存在多个候选时，列出标题与路径，请用户选定；不要按最近修改时间猜。
- 可读取项目的审稿记录、`project.yaml` 和相关 vault 笔记核对关键引用、图片授权、发布状态。vault 在本流程中只读；不要把未核实的 wiki 判断补进公开稿，也不要重写文章论点。
- 成稿若标记为 `draft`、含待办、私有绝对路径、未解析 wikilink 或缺失图片，先修正或退回写作环节。不要用删除正文段落的方式让预检通过。

## 渠道与交付

| 渠道 | 实际方式 | 读哪份规则 |
| --- | --- | --- |
| `apframework` | Contentlayer MDX 和静态资源写入博客仓库；构建、浏览器和线上检查分开记录 | [apframework](references/apframework.md) |
| `wechat` | 生成公众号编辑器导入用 Markdown 与本地素材包；若有已授权的平台工具，再走该工具的草稿/群发流程 | [wechat](references/wechat.md) |
| `generic-md` | 生成可迁移的 Markdown 与相对图片路径 | [generic-md](references/generic-md.md) |

没有用户指定渠道时，沿用原 skill 的 `apframework` 默认值。新增渠道时单独增加规则与适配实现，不把博客的 MDX 要求套在其他渠道。

## 执行

脚本用 Node.js 20+，无第三方依赖。相对路径示例均从本 skill 目录运行；从其他目录调用时使用脚本绝对路径。

```bash
node scripts/publish.mjs --project /absolute/path/to/writing-project --channel generic-md --json
node scripts/publish.mjs --article /absolute/path/to/article.md --channel wechat --output /absolute/path/to/export --json
node scripts/publish.mjs --project /absolute/path/to/writing-project --channel apframework --blog-root /absolute/path/to/blog --slug english-slug --json
```

`--project` 默认输出到项目内 `exports/<channel>/`。`--article` 需提供 `--output` 或 apframework 的 `--blog-root`。本地素材默认只能来自文章项目目录；确需引用 vault 等外部目录时，用 `--asset-root /absolute/allowed/root` 明确扩大可复制范围。缺少公开摘要或发布日期时补充 `--summary`、`--date YYYY-MM-DD`；标题可用 `--title` 明确指定。已存在目标文件时脚本停止，只有确认将替换哪篇稿和哪些资源后才使用 `--replace`。

脚本成功代表本地文件已生成，不代表站点构建成功或第三方平台已上线。准备包的 `publication.json` 使用相对路径记录源稿哈希、目标文件和 `prepared` 阶段；绝对路径仅在命令输出中。直接写博客仓库时，报告也仅由命令输出返回。

## 完成核对

1. 阅读生成稿，核对标题、摘要、图片说明、署名链接、正文和外部引用；检查所有图片在目标渠道可显示。不能仅依赖字符串预检。
2. 按渠道规则执行构建或编辑器预览。`apframework` 需要 Contentlayer/Next 构建和实际页面检查；公众号需在编辑器里检查 SVG、表格和代码块。
3. 报告源文件、渠道、输出文件与素材、执行过的验证及其结果、尚需的人工作业。只有确认公开 URL 可访问后才报告 `live`。不要把本地生成、Git commit、公众号草稿或发布请求当作上线证明。

## 边界

- 不回写源文章、vault raw/wiki 或写作过程稿，除非用户直接要求。
- 图片和授权说明以成稿及其素材为准。缺少头图时不自动替作者选图；新增 Unsplash 图片需核对许可、作者和图片页署名，并按渠道规则处理。
- 使用用户已授权且可用的发布工具完成其要求的实际发布；如果平台只支持素材准备，就明确报告停在 `prepared`。
