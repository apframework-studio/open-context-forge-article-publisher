# Open Context Forge Article Publisher · 文章发布

语言：[English](README.md) · **简体中文**

**把已经审稿的文章整理成目标渠道可用的发布文件。**

Open Context Forge Article Publisher 是 Open Context Forge 的“成稿到渠道”阶段 Agent Skill。它选择已有文章、检查公开发布阻断项、复制本地图片，并按渠道生成输出；不负责重新写文章或修改知识库。实际操作入口为 [SKILL.md](SKILL.md)，各渠道规则在 `references/` 中。

## 使用条件

- Agent 能读取整个 Skill 目录，并访问正式稿及其图片。
- Node.js 20 或更新版本；发布脚本只使用 Node.js 内置模块。
- 已审稿的 Markdown 或 MDX。写作项目可以使用 `article.md`、`published.md` 或 `final.md`。
- 对导出目录有写入权限；直接写入 apframework 博客时，还需对该仓库有写入权限。

## 在对话中使用

将**整个仓库**加入 Agent 的 Skill 搜索路径，保留 `SKILL.md`、`references/` 和 `scripts/` 的相对位置。未注册 Skill 时，也可以让 Agent 通过绝对路径读取 `SKILL.md`。

例如：

> 使用 `$open-context-forge-article-publisher`，将 `/absolute/path/to/writing-project` 准备为 apframework 发布包，输出到 `/absolute/path/to/review-package`。检查文章和图片，并报告真正上线前还需要完成什么。

传入写作项目目录时，脚本依次选择 `article.md`、`published.md`、`final.md`；也可以直接指定文章文件。若请求可能对应多个项目，Agent 应请你选择，不凭修改时间猜测。只有明确指定时才读取旧 vault 归档稿。

## 渠道与交付阶段

| 渠道 | 当前输出 | 阶段含义 |
| --- | --- | --- |
| `apframework` | Contentlayer MDX 与静态图片 | 导出包为 `prepared`；写入博客仓库为 `written-to-repository`。构建、部署和公开链接检查另算。 |
| `wechat` | 公众号编辑器导入用 Markdown 与素材 | 仅为 `prepared`，不表示已创建平台草稿或已群发。 |
| `generic-md` | 通用 Markdown 与相对图片路径 | 仅为 `prepared`，目标平台仍需自己的发布步骤。 |

只有核对过可访问的公开 URL，才能报告文章 **live**。具体操作见 [apframework](references/apframework.md)、[微信公众号](references/wechat.md) 与 [通用 Markdown](references/generic-md.md) 规则。

## 手动运行脚本

以下命令从本仓库根目录运行；从其他目录运行时使用脚本绝对路径：

```bash
# 先生成可审阅发布包，不修改源文章。
node scripts/publish.mjs --project /absolute/path/to/writing-project \
  --channel apframework --output /absolute/path/to/review-package --json

# 生成公众号编辑器导入包。
node scripts/publish.mjs --article /absolute/path/to/article.md \
  --channel wechat --output /absolute/path/to/wechat-package --json

# 需要写入已检出的博客仓库时。
node scripts/publish.mjs --project /absolute/path/to/writing-project \
  --channel apframework --blog-root /absolute/path/to/blog \
  --slug english-slug --json
```

只传 `--project` 时，默认输出到 `<project>/exports/<channel>/`。传 `--article` 时，需要 `--output`，或 apframework 渠道的 `--blog-root`。正式稿缺少公开元数据时，可提供 `--title`、`--summary`、`--date YYYY-MM-DD`。本地素材默认只能来自文章项目目录；确需引用外部素材，用 `--asset-root /absolute/allowed/root` 明确扩大范围。已有输出默认不覆盖，只有确认替换目标后才使用 `--replace`。

脚本会阻断草稿状态、未解析的 wiki 链接、待办标记、常见本机绝对路径、缺失图片和图片重名冲突。准备包中的 `publication.json` 记录源稿哈希与**相对**输出路径；直接写博客时，只在命令输出中返回报告，不向博客仓库加入含本机路径的清单。生成后仍需人工复核正文，并完成渠道构建或编辑器预览。

## 项目文件

- [SKILL.md](SKILL.md)：Agent 工作流、成稿选择和发布边界。
- [scripts/publish.mjs](scripts/publish.mjs)：确定性的渠道导出命令。
- [references/](references/)：各渠道的准备与验证规则。
- [docs/design.md](docs/design.md)：功能设计和交付阶段。
- [docs/implementation-plan.md](docs/implementation-plan.md)：首版实现计划。
- [tests/publish.test.mjs](tests/publish.test.mjs)：脚本行为测试。

开发时运行 `npm test`。本项目采用 [MIT 许可证](LICENSE)。
