#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const CHANNELS = new Set(['apframework', 'wechat', 'generic-md']);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']);

export function selectArticle({ article, project } = {}) {
  if (Boolean(article) === Boolean(project)) throw new Error('Pass exactly one of --article or --project');
  if (article) {
    const selected = path.resolve(article);
    if (!fs.existsSync(selected) || !fs.statSync(selected).isFile()) throw new Error(`Article does not exist: ${selected}`);
    return selected;
  }
  const root = path.resolve(project);
  for (const name of ['article.md', 'published.md', 'final.md']) {
    const candidate = path.join(root, name);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`No reviewed article found in ${root}`);
}

function unquote(value) {
  const text = value.trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1).replace(/''/g, "'").replace(/\\"/g, '"');
  }
  return text;
}

function readArticle(file) {
  const original = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const frontmatter = {};
  let body = original;
  if (original.startsWith('---\n') || original.startsWith('---\r\n')) {
    const match = original.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) throw new Error('Unclosed YAML frontmatter');
    body = original.slice(match[0].length);
    const lines = match[1].split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      const field = lines[index].match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
      if (!field) continue;
      if (field[1] === 'tags' && !field[2].trim()) {
        const tags = [];
        while (index + 1 < lines.length) {
          const item = lines[index + 1].match(/^\s+-\s+(.+)$/);
          if (!item) break;
          tags.push(unquote(item[1]));
          index++;
        }
        frontmatter.tags = tags;
      } else {
        frontmatter[field[1]] = unquote(field[2]);
      }
    }
  }
  return { original, body, frontmatter };
}

function tagsFrom(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  const raw = value.trim();
  if (!raw.startsWith('[') || !raw.endsWith(']')) return [];
  return raw.slice(1, -1).split(',').map(unquote).filter(Boolean);
}

function publicMetadata(article, options) {
  const heading = article.body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const title = options.title || article.frontmatter.title || heading;
  const summary = options.summary || article.frontmatter.summary || '';
  const date = options.date || article.frontmatter.published || article.frontmatter.date || article.frontmatter.updated || article.frontmatter.created || '';
  if (!title) throw new Error('Public title is required');
  if ((options.channel === 'apframework' || options.channel === 'wechat') && !summary) throw new Error('Public summary is required');
  if (options.channel === 'apframework' && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Publication date YYYY-MM-DD is required');
  return { title, summary, date, tags: tagsFrom(article.frontmatter.tags) };
}

function validatePublicBody(body, frontmatter) {
  if (/^(draft|raw|active|in_progress|unreviewed)$/i.test(frontmatter.status || '') || frontmatter.draft === 'true') {
    throw new Error('Article is marked as draft');
  }
  const checks = [
    [/\b(?:TODO|TBD)\b/i, 'TODO/TBD marker'],
    [/\[\[[^\]]+\]\]/, 'unresolved wiki link'],
    [/(?:\/Users\/|\/home\/|[A-Za-z]:\\Users\\)/, 'local absolute path'],
    [/未确认大纲草稿|本地材料：/, 'internal process text'],
  ];
  for (const [pattern, label] of checks) if (pattern.test(body)) throw new Error(`Article contains ${label}`);
}

function yamlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function renderApframework(body, metadata) {
  const cleanBody = body.replace(/^\s*#\s+[^\n]+\r?\n/, '').trimStart();
  const tags = metadata.tags.map(yamlString).join(', ');
  return `---\ntitle: ${yamlString(metadata.title)}\ndate: ${yamlString(metadata.date)}\ntags: [${tags}]\ndraft: false\nsummary: ${yamlString(metadata.summary)}\n---\n\n${cleanBody.trimEnd()}\n`;
}

function isRemote(ref) {
  return /^(?:https?:|data:|mailto:|#)/i.test(ref);
}

function localAsset(ref, articleFile, allowedRoot) {
  const clean = ref.split(/[?#]/, 1)[0];
  if (!clean || isRemote(ref)) return null;
  const ext = path.extname(clean).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) return null;
  if (path.isAbsolute(clean)) throw new Error(`Absolute asset path is not portable: ${ref}`);
  let decoded;
  try { decoded = decodeURIComponent(clean); } catch { throw new Error(`Invalid asset URL encoding: ${ref}`); }
  const source = path.resolve(path.dirname(articleFile), decoded);
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) throw new Error(`missing asset: ${ref}`);
  const relative = path.relative(allowedRoot, fs.realpathSync(source));
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Asset is outside the allowed asset root: ${ref}`);
  }
  return { source, basename: path.basename(source), suffix: ref.slice(clean.length) };
}

function rewriteAssets(body, articleFile, prefix, allowedRoot) {
  const assets = new Map();
  const names = new Map();
  function rewrite(ref) {
    const asset = localAsset(ref, articleFile, allowedRoot);
    if (!asset) return ref;
    const prior = names.get(asset.basename);
    if (prior && prior !== asset.source) throw new Error(`Asset filename collision: ${asset.basename}`);
    names.set(asset.basename, asset.source);
    assets.set(asset.source, asset.basename);
    return `${prefix}${asset.basename}${asset.suffix}`;
  }
  let rendered = body.replace(/(!\[[^\]\n]*\]\()([^\s)]+)(\))/g, (_match, before, ref, after) => `${before}${rewrite(ref)}${after}`);
  rendered = rendered.replace(/(?<!!)(\[[^\]\n]+\]\()([^\s)]+)(\))/g, (_match, before, ref, after) => `${before}${rewrite(ref)}${after}`);
  rendered = rendered.replace(/(\b(?:src|href)\s*=\s*["'])([^"']+)(["'])/g, (_match, before, ref, after) => `${before}${rewrite(ref)}${after}`);
  return { body: rendered, assets: [...assets].map(([source, basename]) => ({ source, basename })) };
}

function assertAvailable(paths, replace) {
  if (replace) return;
  const existing = paths.find((file) => fs.existsSync(file));
  if (existing) throw new Error(`Output already exists: ${existing}`);
}

export async function preparePublication(options = {}) {
  const channel = options.channel || 'apframework';
  if (!CHANNELS.has(channel)) throw new Error(`Unsupported channel: ${channel}`);
  if (options.blogRoot && channel !== 'apframework') throw new Error('--blog-root is only valid for apframework');
  if (options.blogRoot && options.output) throw new Error('Use either --blog-root or --output');
  const articleFile = selectArticle(options);
  const article = readArticle(articleFile);
  validatePublicBody(article.body, article.frontmatter);
  const metadata = publicMetadata(article, { ...options, channel });
  const projectRoot = options.project ? path.resolve(options.project) : path.dirname(articleFile);
  const outputRoot = options.blogRoot
    ? path.resolve(options.blogRoot)
    : options.output
      ? path.resolve(options.output)
      : options.project
        ? path.join(projectRoot, 'exports', channel)
        : null;
  if (!outputRoot) throw new Error('--output is required when --article is used');
  const slug = options.slug || path.basename(projectRoot);
  if (channel === 'apframework' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('apframework slug must contain lowercase ASCII words separated by hyphens');
  const id = `${metadata.date}-${slug}`;
  const assetPrefix = channel === 'apframework' ? `/static/images/${id}/` : 'assets/';
  const allowedRoot = fs.realpathSync(options.assetRoot ? path.resolve(options.assetRoot) : projectRoot);
  const rewritten = rewriteAssets(article.body, articleFile, assetPrefix, allowedRoot);
  const content = channel === 'apframework' ? renderApframework(rewritten.body, metadata) : rewritten.body.trim() + '\n';
  const targetArticle = channel === 'apframework'
    ? path.join(outputRoot, 'data', 'blog', 'essay', `${id}.mdx`)
    : path.join(outputRoot, 'article.md');
  const assetDir = channel === 'apframework'
    ? path.join(outputRoot, 'public', 'static', 'images', id)
    : path.join(outputRoot, 'assets');
  const manifestFile = options.blogRoot ? null : path.join(outputRoot, 'publication.json');
  const assetTargets = rewritten.assets.map((asset) => path.join(assetDir, asset.basename));
  assertAvailable([targetArticle, ...assetTargets, ...(manifestFile ? [manifestFile] : [])], options.replace);
  const level = options.blogRoot ? 'written-to-repository' : 'prepared';
  const manifest = {
    channel, level, source: articleFile,
    sourceSha256: crypto.createHash('sha256').update(article.original).digest('hex'),
    title: metadata.title, summary: metadata.summary, date: metadata.date,
    article: targetArticle, assets: assetTargets,
    warnings: channel === 'wechat' && rewritten.assets.some(({ basename }) => basename.endsWith('.svg'))
      ? ['SVG assets need preview or conversion in the WeChat editor'] : [],
  };
  fs.mkdirSync(path.dirname(targetArticle), { recursive: true });
  fs.writeFileSync(targetArticle, content);
  if (rewritten.assets.length) fs.mkdirSync(assetDir, { recursive: true });
  for (const asset of rewritten.assets) fs.copyFileSync(asset.source, path.join(assetDir, asset.basename));
  if (manifestFile) {
    const portableManifest = {
      ...manifest,
      source: path.basename(articleFile),
      article: path.relative(outputRoot, targetArticle).split(path.sep).join('/'),
      assets: assetTargets.map((target) => path.relative(outputRoot, target).split(path.sep).join('/')),
    };
    fs.writeFileSync(manifestFile, JSON.stringify(portableManifest, null, 2) + '\n');
  }
  return manifest;
}

function parseArgs(argv) {
  const options = {};
  const names = { '--article': 'article', '--project': 'project', '--channel': 'channel', '--output': 'output', '--blog-root': 'blogRoot', '--asset-root': 'assetRoot', '--slug': 'slug', '--date': 'date', '--title': 'title', '--summary': 'summary' };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--replace') { options.replace = true; continue; }
    if (token === '--json') { options.json = true; continue; }
    if (!names[token] || !argv[i + 1]) throw new Error(`Unknown or incomplete option: ${token}`);
    options[names[token]] = argv[++i];
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = await preparePublication(options);
    process.stdout.write(JSON.stringify(report, null, options.json ? 0 : 2) + '\n');
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
