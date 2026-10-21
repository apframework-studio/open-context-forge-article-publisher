# Portable Markdown

输出 `article.md`、`assets/` 和 `publication.json`，用于需要人工导入、Git 仓库发布或后续新增的渠道适配。移除源稿 frontmatter 中的内部字段；保留正文标题和论证结构。本地图片及指向图片的链接改成 `assets/<filename>`，远程网页引用保持原样。

交付前打开 Markdown 预览，核对图、链接、代码块和表格。包仅表示 `prepared`；目标平台若有自己的 frontmatter、上传协议、HTML 清洗或 API，须增加渠道适配规则与验证，不直接将此包视为已上线内容。
