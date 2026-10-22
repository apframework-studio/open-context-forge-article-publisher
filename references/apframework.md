# apframework.com

## 输入与路径

支持 `article.md`、`published.md`、`final.md` 和显式 Markdown/MDX。博客仓库示例路径为 `/absolute/path/to/blog`；实际运行以用户指定或已核实的仓库路径为准。

输出：

```text
<blog>/data/blog/essay/YYYY-MM-DD-<english-slug>.mdx
<blog>/public/static/images/YYYY-MM-DD-<english-slug>/
```

`--output` 可先生成同样的相对布局和本地 `publication.json` 用于审阅；`--blog-root` 才写入博客仓库，此时报告只打印到命令输出。脚本只保留公开 frontmatter：`title`, `date`, `tags`, `draft: false`, `summary`。`type/status/sources/claims/style_profile` 等内部字段不会进入 MDX。日期优先来自 `published`，其次 `date/updated/created`；必要时传 `--date`。文章 H1 由站点标题渲染，不重复放在正文。

## 渲染与素材

- 文章中本地 Markdown 图片、HTML `<img src>` 和指向图片的链接会复制到静态目录，并改写成 `/static/images/...`。缺失素材和重名但内容来源不同的素材会阻断输出。
- 保留原文图注、作者署名和外部参考链接。现有 Unsplash 图的作者与图片页链接应在成稿中可追溯。需要新加头图时先确认图片选择与授权，再下载、压缩，检查有损图片小于 1 MB。
- 含 `<figure>`/`<figcaption>` 的 MDX 应避免 `<p>` 内再嵌 `<p>`。原文里的复杂 JSX、组件和 HTML 需要浏览器复核；转换脚本不替代 MDX 编译器。
- 不机械插入目录、附录或新正文结构；沿用已审稿文章的组织。若添加站点专有组件，先核对博客现有用法。

## 验证与上线

1. 在博客仓库检查 `git status --short` 和 MDX diff，确认文件与素材均属本篇文章。
2. 运行站点构建脚本（当前仓库可用 `npm run build`；安装了 Yarn 时也可用 `yarn build`），确认 Contentlayer 识别文章。若站点依赖未安装，报告这一验证未完成。
3. 打开本地目标页面，检查图片、目录、链接、控制台和 hydration 错误；特别确认没有非法的 `<p><p>` 嵌套。
4. 只有部署完成且公开 URL 实际可访问，才把状态提升到 `live`。本地文件写入仅为 `written-to-repository`。
