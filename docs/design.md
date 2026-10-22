# Open Context Forge article publisher design

## Purpose and boundary

Publish an already reviewed article from an Open Context Forge writing project to a selected channel. The knowledge vault supplies source and style context upstream; publishing reads the finished article and its assets without rewriting the vault or the author's argument. This keeps the chain `raw → wiki → writing project → channel export` aligned with the local vault purpose and the [LLM Wiki README](https://github.com/nashsu/llm_wiki/blob/main/README_CN.md). The publisher does not implement LLM Wiki ingestion, search, graph, or chat.

The existing skill is the compatibility baseline. The standalone repository becomes the distributable skill. It accepts the current writer's `article.md` and legacy `published.md` / `final.md`, as well as an explicit Markdown or MDX file.

## Delivery levels

1. **Prepared**: a validated channel package and manifest exist locally.
2. **Written to channel repository**: apframework files exist under the blog's Contentlayer and public asset paths; site build and browser review are reported separately.
3. **Live**: a public URL has been checked after the channel's real publishing mechanism runs. A prepared file, local build, or draft is never reported as live.

## Components

- `SKILL.md`: entrypoint, source selection, delivery levels, verification and routing.
- `scripts/publish.mjs`: deterministic CLI. Resolves article, extracts public metadata, checks readiness and private residues, copies local assets, and rewrites image and asset links. Prepared packages receive a portable manifest; direct blog writes report through stdout. Writes nothing if preflight fails. Refuses to replace existing output unless explicitly requested.
- `references/apframework.md`: Contentlayer MDX layout, build and browser checks, attribution and publication semantics.
- `references/wechat.md`: Markdown and asset package for editor import; actual account draft/publication requires a separately available authorized channel tool.
- `references/generic-md.md`: portable Markdown package.

The CLI uses Node built-ins only. Channel adapters share preflight but own path and format decisions; adding a channel does not change the article's source or the other adapters.

Initial delivery differs by channel: apframework writes to a Git repository, WeChat produces an editor import package, and generic Markdown produces a portable archive. Future platforms such as Zhihu, Juejin or Substack need their own adapter for authentication, upload, draft creation, publication and public URL verification. Those actions should be implemented only against an available authorized platform tool; the existing package must never claim that an unsupported platform was published.

## Data contract

Input: `--article <file>` or `--project <dir>`, exactly one; optional `--channel`, `--output`, `--blog-root`, `--asset-root`, `--slug`, `--date`, `--title`, `--summary`, `--replace`, `--json`. Project selection order: `article.md`, `published.md`, `final.md`. If both `--output` and `--blog-root` are absent, use `<project>/exports/<channel>` for project inputs, otherwise require an output path. `--blog-root` is for apframework only. Local assets must resolve within the selected project unless `--asset-root` explicitly widens the allowed source tree.

Metadata: title from explicit option, frontmatter, then first H1; date from explicit option then `published`, `date`, `updated`, `created`; summary from explicit option then frontmatter. Internal frontmatter keys never flow into channel frontmatter. An explicit draft status blocks publishing. Existing public references and prose remain intact unless they contain private paths or unresolved wiki links. Local image files and links to image assets are copied and rewritten; missing assets or unsafe target paths block output.

Output: channel article and copied assets. Prepared packages include `publication.json` with source hash, relative target paths, and level `prepared`; absolute paths are confined to CLI output. Direct blog writes return the `written-to-repository` report on stdout and do not place a manifest containing local paths in the blog repository. `apframework` writes the expected `data/blog/essay/<date>-<slug>.mdx` and `public/static/images/<date>-<slug>/` layout. Other channels produce `article.md` plus `assets/`.

## Validation

Node tests use temporary writing projects and blog repositories. They cover source precedence, public metadata, asset copying, blockers, collisions, overwrite behavior, and each channel's output. Skill frontmatter validation and a dry run on one real published article supplement the tests. Real third-party publication is outside this implementation because no channel credentials or target article were supplied.
