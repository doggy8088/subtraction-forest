import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('dist');
const origin = 'https://subtraction-forest.gh.miniasp.com';
const html = await readFile(`${root}/index.html`, 'utf8');
const attrs = (tag) =>
  Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]),
  );
const meta = Object.fromEntries(
  [...html.matchAll(/<meta\b[^>]*>/g)].map((m) => {
    const a = attrs(m[0]);
    return [a.property ?? a.name, a.content];
  }),
);
const links = [...html.matchAll(/<link\b[^>]*>/g)].map((m) => attrs(m[0]));
assert.equal(links.filter((l) => l.rel === 'canonical').length, 1);
assert.equal(links.find((l) => l.rel === 'canonical').href, `${origin}/`);
assert.match(html, /lang="zh-Hant"/);
assert.equal([...html.matchAll(/<h1[ >]/g)].length, 1);
assert.match(html, /data-prerendered="true"/);
assert.match(html, /每一次嘗試/);
for (const chapter of ['暖陽小徑', '蘑菇森林', '星光溪谷', '雲朵樹屋'])
  assert.ok(html.includes(chapter), `Missing prerendered chapter: ${chapter}`);
assert.doesNotMatch(
  html,
  /<!--\$!-->|<template/,
  'Suspense must resolve at build time',
);
assert.match(html, /© 2026/);
for (const name of [
  'description',
  'author',
  'robots',
  'og:type',
  'og:locale',
  'og:site_name',
  'og:title',
  'og:description',
  'og:url',
  'og:image',
  'og:image:type',
  'og:image:width',
  'og:image:height',
  'og:image:alt',
  'twitter:card',
  'twitter:title',
  'twitter:description',
  'twitter:image',
  'twitter:image:alt',
])
  assert.ok(meta[name], `Missing ${name}`);
assert.equal(meta['og:url'], `${origin}/`);
assert.equal(meta['og:image'], `${origin}/social-card.png`);
assert.equal(meta['twitter:image'], meta['og:image']);
assert.equal(meta['og:image:type'], 'image/png');
const jsonld = JSON.parse(
  html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
);
assert.equal(jsonld.author.name, 'Will 保哥');
assert.equal(jsonld.author.url, 'https://github.com/doggy8088');
assert.equal(jsonld.url, `${origin}/`);
assert.equal(jsonld.offers.price, '0');
assert.equal(jsonld.isAccessibleForFree, true);
for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
  const path = match[1];
  if (/^https?:|^data:/.test(path)) continue;
  assert.ok(
    (await stat(resolve(root, path.replace(/^\//, '')))).isFile(),
    `Missing ${path}`,
  );
}
async function png(path, width, height) {
  const data = await readFile(`${root}/${path}`);
  assert.equal(data.subarray(1, 4).toString(), 'PNG');
  assert.equal(data.readUInt32BE(16), width, path);
  assert.equal(data.readUInt32BE(20), height, path);
}
await png(
  'social-card.png',
  Number(meta['og:image:width']),
  Number(meta['og:image:height']),
);
for (const size of [16, 32, 48]) await png(`favicon-${size}.png`, size, size);
await png('apple-touch-icon.png', 180, 180);
const manifest = JSON.parse(await readFile(`${root}/site.webmanifest`, 'utf8'));
assert.equal(manifest.start_url, '/');
for (const icon of manifest.icons) {
  const [w, h] = icon.sizes.split('x').map(Number);
  await png(icon.src, w, h);
}
assert.equal(
  (await readFile(`${root}/CNAME`, 'utf8')).trim(),
  new URL(origin).hostname,
);
assert.equal(
  await readFile('CNAME', 'utf8'),
  await readFile(`${root}/CNAME`, 'utf8'),
);
assert.ok(
  (await readFile(`${root}/robots.txt`, 'utf8')).includes(
    `${origin}/sitemap.xml`,
  ),
);
assert.ok(
  (await readFile(`${root}/sitemap.xml`, 'utf8')).includes(`${origin}/`),
);
assert.match(await readFile('LICENSE', 'utf8'), /Copyright © 2026 Will 保哥/);
console.log(
  'Static site checks passed: SEO, structured data, resources, icons, manifest, domain, and copyright.',
);
