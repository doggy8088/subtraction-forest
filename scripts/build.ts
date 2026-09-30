import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { createElement } from 'react';
import { renderToReadableStream } from 'react-dom/server';
import App from '../src/App';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
const result = await Bun.build({
  entrypoints: ['./src/main.tsx'],
  outdir: './dist',
  target: 'browser',
  format: 'esm',
  splitting: true,
  minify: true,
  naming: {
    entry: 'assets/[name]-[hash].[ext]',
    chunk: 'assets/[name]-[hash].[ext]',
    asset: 'assets/[name]-[hash].[ext]',
  },
  define: { 'process.env.NODE_ENV': '"production"' },
});
for (const log of result.logs) console.error(log);
if (
  !result.success ||
  result.logs.some((log) => log.level === 'warning' || log.level === 'error')
) {
  throw new Error('Resolve all build warnings and errors before release.');
}
const entry = result.outputs.find(
  (output) => output.kind === 'entry-point' && output.path.endsWith('.js'),
);
const style = result.outputs.find((output) => output.path.endsWith('.css'));
if (!entry || !style)
  throw new Error('Expected application JavaScript and CSS outputs.');
const publicPath = (path: string) =>
  `./${relative('dist', path).replaceAll('\\', '/')}`;
// Resolve Suspense on the build machine so the browser hydrates the exact
// same homepage, without replacing a differently sized SEO placeholder.
const stream = await renderToReadableStream(createElement(App));
await stream.allReady;
const markup = await new Response(stream).text();
// This single-page app has a small stylesheet. Inline it so the first paint
// needs only the document, without a render-blocking CSS round trip.
const css = await style.text();
const html = (await readFile('index.html', 'utf8'))
  .replace(
    /<!--app:start-->[\s\S]*?<!--app:end-->/,
    `<div id="root" data-prerendered="true">${markup}</div>`,
  )
  .replaceAll('href="./public/', 'href="/')
  .replace('src="./src/main.tsx"', `src="${publicPath(entry.path)}"`)
  .replace('</head>', `<style>${css}</style>\n</head>`);
await cp('public', 'dist', { recursive: true });
await writeFile('dist/index.html', html);
for (const output of result.outputs)
  console.log(
    `${relative('dist', output.path)} ${(output.size / 1024).toFixed(1)} kB`,
  );
console.log('Bun production build completed without warnings.');
