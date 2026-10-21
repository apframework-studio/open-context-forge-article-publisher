import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { preparePublication, selectArticle } from '../scripts/publish.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-publisher-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const project = path.join(root, 'writing-projects', 'agent-meaning');
  fs.mkdirSync(path.join(project, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(project, 'assets', 'diagram.drawio.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  fs.writeFileSync(path.join(project, 'assets', 'hero.jpg'), 'image-bytes');
  const article = path.join(project, 'published.md');
  fs.writeFileSync(article, `---
type: published
status: published_ready
title: "智能体语义层"
summary: "一段公开摘要"
tags: [AI Agent, Ontology]
published: 2026-10-20
sources:
  - input/notes.md
---

# 智能体语义层

![架构图](assets/diagram.drawio.svg)

<img src="assets/hero.jpg" alt="头图" />

[查看高清图](assets/diagram.drawio.svg)

正文内容。
`);
  return { root, project, article };
}

test('selects current article before legacy outputs', (t) => {
  const { project, article } = fixture(t);
  assert.equal(selectArticle({ project }), article);
  const current = path.join(project, 'article.md');
  fs.writeFileSync(current, '# 当前稿\n');
  assert.equal(selectArticle({ project }), current);
});

test('prepares apframework MDX, copies assets, and strips internal metadata', async (t) => {
  const { root, article } = fixture(t);
  const blogRoot = path.join(root, 'blog');
  const result = await preparePublication({ article, channel: 'apframework', blogRoot, slug: 'agent-meaning' });
  const target = path.join(blogRoot, 'data/blog/essay/2026-10-20-agent-meaning.mdx');
  const content = fs.readFileSync(target, 'utf8');
  assert.equal(result.level, 'written-to-repository');
  assert.equal(result.article, target);
  assert.match(content, /title: '智能体语义层'/);
  assert.match(content, /tags: \['AI Agent', 'Ontology'\]/);
  assert.doesNotMatch(content, /type: published|sources:|# 智能体语义层/);
  assert.match(content, /!\[架构图\]\(\/static\/images\/2026-10-20-agent-meaning\/diagram.drawio.svg\)/);
  assert.match(content, /src="\/static\/images\/2026-10-20-agent-meaning\/hero.jpg"/);
  assert.match(content, /\[查看高清图\]\(\/static\/images\/2026-10-20-agent-meaning\/diagram.drawio.svg\)/);
  assert.ok(fs.existsSync(path.join(blogRoot, 'public/static/images/2026-10-20-agent-meaning/diagram.drawio.svg')));
  assert.equal(fs.existsSync(path.join(blogRoot, 'publication.json')), false);
  assert.equal(fs.existsSync(path.join(blogRoot, '.ocf-publications')), false);
});

test('supports multiple blog articles without repository manifests', async (t) => {
  const { root, article } = fixture(t);
  const blogRoot = path.join(root, 'blog');
  await preparePublication({ article, channel: 'apframework', blogRoot, slug: 'agent-meaning' });
  await preparePublication({ article, channel: 'apframework', blogRoot, slug: 'another-article' });
  assert.ok(fs.existsSync(path.join(blogRoot, 'data/blog/essay/2026-10-20-agent-meaning.mdx')));
  assert.ok(fs.existsSync(path.join(blogRoot, 'data/blog/essay/2026-10-20-another-article.mdx')));
});

test('prepares portable Markdown with relative asset paths', async (t) => {
  const { root, article } = fixture(t);
  const output = path.join(root, 'generic');
  const result = await preparePublication({ article, channel: 'generic-md', output });
  const content = fs.readFileSync(path.join(output, 'article.md'), 'utf8');
  assert.equal(result.level, 'prepared');
  assert.match(content, /^# 智能体语义层/m);
  assert.match(content, /!\[架构图\]\(assets\/diagram.drawio.svg\)/);
  assert.doesNotMatch(content, /status: published_ready|sources:/);
  assert.ok(fs.existsSync(path.join(output, 'assets', 'hero.jpg')));
});

test('wechat package keeps public title and summary in manifest', async (t) => {
  const { root, article } = fixture(t);
  const output = path.join(root, 'wechat');
  await preparePublication({ article, channel: 'wechat', output });
  const manifest = JSON.parse(fs.readFileSync(path.join(output, 'publication.json'), 'utf8'));
  assert.equal(manifest.title, '智能体语义层');
  assert.equal(manifest.summary, '一段公开摘要');
  assert.equal(manifest.level, 'prepared');
  assert.equal(manifest.article, 'article.md');
  assert.deepEqual(manifest.assets, ['assets/diagram.drawio.svg', 'assets/hero.jpg']);
  assert.equal(JSON.stringify(manifest).includes(root), false);
  assert.match(fs.readFileSync(path.join(output, 'article.md'), 'utf8'), /assets\/diagram.drawio.svg/);
});

test('rejects unresolved private content and leaves no output', async (t) => {
  const { root, article } = fixture(t);
  fs.appendFileSync(article, '\nTODO: check [[private-note]] at /Users/me/secret.md\n');
  const output = path.join(root, 'blocked');
  await assert.rejects(() => preparePublication({ article, channel: 'generic-md', output }), /TODO|wiki link|absolute path/);
  assert.equal(fs.existsSync(output), false);
});

test('rejects missing assets and draft status', async (t) => {
  const { root, article } = fixture(t);
  fs.appendFileSync(article, '\n![不存在](assets/missing.png)\n');
  await assert.rejects(() => preparePublication({ article, channel: 'generic-md', output: path.join(root, 'missing') }), /missing asset/);
  const source = fs.readFileSync(article, 'utf8').replace('published_ready', 'draft').replace('\n![不存在](assets/missing.png)\n', '');
  fs.writeFileSync(article, source);
  await assert.rejects(() => preparePublication({ article, channel: 'generic-md', output: path.join(root, 'draft') }), /draft/);
});

test('requires an explicit asset root before copying files outside the project', async (t) => {
  const { root, project, article } = fixture(t);
  fs.writeFileSync(path.join(root, 'external.png'), 'external-image');
  fs.appendFileSync(article, '\n![外部素材](../../external.png)\n');
  await assert.rejects(
    () => preparePublication({ project, channel: 'generic-md', output: path.join(root, 'blocked-external') }),
    /outside the allowed asset root/,
  );
  const result = await preparePublication({ article, channel: 'generic-md', output: path.join(root, 'allowed-external'), assetRoot: root });
  assert.equal(result.assets.length, 3);
});

test('accepts a new writer article without frontmatter when public fields are supplied', async (t) => {
  const { root, project } = fixture(t);
  fs.writeFileSync(path.join(project, 'article.md'), '# 新稿标题\n\n正文。\n');
  const result = await preparePublication({ project, channel: 'apframework', output: path.join(root, 'new-writer'), summary: '公开摘要', date: '2026-10-22' });
  assert.match(fs.readFileSync(result.article, 'utf8'), /title: '新稿标题'/);
});

test('preserves multiline YAML tag lists used by existing writing projects', async (t) => {
  const { root, article } = fixture(t);
  const source = fs.readFileSync(article, 'utf8').replace('tags: [AI Agent, Ontology]', 'tags:\n  - AI Agent\n  - Ontology');
  fs.writeFileSync(article, source);
  const result = await preparePublication({ article, channel: 'apframework', output: path.join(root, 'multiline-tags'), slug: 'agent-meaning' });
  assert.match(fs.readFileSync(result.article, 'utf8'), /tags: \['AI Agent', 'Ontology'\]/);
});

test('refuses to overwrite an existing publication', async (t) => {
  const { root, article } = fixture(t);
  const output = path.join(root, 'generic');
  await preparePublication({ article, channel: 'generic-md', output });
  await assert.rejects(() => preparePublication({ article, channel: 'generic-md', output }), /already exists/);
});
