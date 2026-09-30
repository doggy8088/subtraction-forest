import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { relative } from 'node:path';

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
const html = (await readFile('index.html', 'utf8'))
  .replaceAll('href="./public/', 'href="/')
  .replace('src="./src/main.tsx"', `src="${publicPath(entry.path)}"`)
  .replace(
    '</head>',
    `<link rel="stylesheet" href="${publicPath(style.path)}" />\n</head>`,
  );
await cp('public', 'dist', { recursive: true });
await writeFile('dist/index.html', html);
for (const output of result.outputs)
  console.log(
    `${relative('dist', output.path)} ${(output.size / 1024).toFixed(1)} kB`,
  );
console.log('Bun production build completed without warnings.');
