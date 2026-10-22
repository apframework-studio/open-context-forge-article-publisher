# Open Context Forge Article Publisher

Language: **English** · [简体中文](README.zh-CN.md)

**Take a reviewed article from a writing project to a channel-specific publication package.**

Open Context Forge Article Publisher is a file-based Agent Skill for the **article-to-channel** stage of Open Context Forge. It selects an existing article, checks for publishing blockers, copies local images, and prepares output for a chosen channel. It does not draft the article or change the knowledge vault. The operational [SKILL.md](SKILL.md) and channel references are currently written in Chinese.

## What you need

- An agent that can read the whole Skill directory and access the finished article and its assets.
- Node.js 20 or newer. The publishing script uses only Node.js built-ins.
- A reviewed Markdown or MDX article. Writing projects may contain `article.md`, `published.md`, or `final.md`.
- Write access to the selected export directory. Writing directly to the apframework blog also requires access to that repository.

## Use it with an agent

Make this entire repository available in your agent's Skill search path, keeping `SKILL.md`, `references/`, and `scripts/` together. You can also ask an agent to read `SKILL.md` by its absolute path without registering the Skill by name.

For example:

> Use `$open-context-forge-article-publisher` to prepare `/absolute/path/to/writing-project` for apframework. Put the output in `/absolute/path/to/review-package`, inspect the article and images, and report what is still needed before it goes live.

When a project directory is supplied, the script looks for `article.md`, then `published.md`, then `final.md`. You can name an article file explicitly. If several projects could match a request, the agent asks you to select one instead of guessing from modification time. A legacy vault archive is used only when explicitly named.

## Channels and delivery status

| Channel | Current output | What it means |
| --- | --- | --- |
| `apframework` | Contentlayer MDX and images in the blog layout | An export is `prepared`; writing to the blog repository is `written-to-repository`. Build, deployment, and public URL checks are separate. |
| `wechat` | Markdown and local assets for a WeChat Official Account editor | An import package is `prepared`. It is not an account draft or a sent post. |
| `generic-md` | Portable Markdown and relative image paths | A reusable package is `prepared`; the destination platform still needs its own publishing step. |

Only a checked public URL establishes that an article is **live**. Channel-specific procedures are in [references/apframework.md](references/apframework.md), [references/wechat.md](references/wechat.md), and [references/generic-md.md](references/generic-md.md).

## Run the script

Run from this repository's root, or use an absolute path to `scripts/publish.mjs`:

```bash
# Prepare a package for review. The source article is not modified.
node scripts/publish.mjs --project /absolute/path/to/writing-project \
  --channel apframework --output /absolute/path/to/review-package --json

# Prepare an editor import package.
node scripts/publish.mjs --article /absolute/path/to/article.md \
  --channel wechat --output /absolute/path/to/wechat-package --json

# Write to a checked-out blog repository when that is the requested delivery.
node scripts/publish.mjs --project /absolute/path/to/writing-project \
  --channel apframework --blog-root /absolute/path/to/blog \
  --slug english-slug --json
```

With `--project` and no destination option, packages go to `<project>/exports/<channel>/`. With `--article`, supply `--output` or, for apframework, `--blog-root`. Use `--title`, `--summary`, or `--date YYYY-MM-DD` when the finished article lacks public metadata. Local assets must resolve inside the article project; `--asset-root /absolute/allowed/root` explicitly allows a wider source tree. Existing outputs are not replaced unless `--replace` is given.

The script rejects draft status, unresolved wiki links, unfinished markers, common local absolute paths, missing images, and conflicting asset names. A prepared package includes `publication.json` with a source hash and **relative** output paths. A direct blog write returns its report on the command line without adding a local-path manifest to the blog repository. The agent still reviews the generated article and performs the channel's build or editor preview.

## Project files

- [SKILL.md](SKILL.md) — agent workflow, source selection, and publishing boundary.
- [scripts/publish.mjs](scripts/publish.mjs) — deterministic channel export CLI.
- [references/](references/) — channel-specific preparation and verification.
- [docs/design.md](docs/design.md) — feature design and delivery levels.
- [docs/implementation-plan.md](docs/implementation-plan.md) — initial implementation sequence.
- [tests/publish.test.mjs](tests/publish.test.mjs) — CLI behavior tests.

Run `npm test` to check the script. The project is licensed under [MIT](LICENSE).
