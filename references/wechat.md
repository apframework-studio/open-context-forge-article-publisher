# WeChat Official Account

本渠道当前的可执行输出是公众号编辑器导入包：`article.md`、`assets/`、`publication.json`。`publication.json` 保存标题、摘要、源稿哈希和素材清单；正文移除 vault/frontmatter，图片使用包内相对路径。默认写入写作项目 `exports/wechat/`，也可以用 `--output` 指定目录。

导入公众号编辑器时，先上传图片，再检查正文图片地址是否被编辑器替换为平台地址。SVG/draw.io SVG 需在编辑器中预览，无法正确显示时转换为清晰的 PNG 后替换。宽表格、长代码块、复杂 HTML/MDX 组件也需在手机预览中检查。标题、摘要和封面图由平台字段设置，不应依赖 Markdown frontmatter。

若用户要求创建草稿或群发，先确认当前环境存在可用的公众号工具和账号权限，再按该工具的实际接口执行，并保存返回的草稿 ID、发布 ID 或公开 URL。不要把本地素材包描述为平台草稿或已群发；失败后不要无界重试可能重复发稿的操作。
