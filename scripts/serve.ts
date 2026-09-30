import { resolve, sep } from 'node:path';

const preview = process.argv.includes('--preview');
const root = resolve(preview ? 'dist' : 'public');
const routes = preview
  ? undefined
  : {
      '/': (await import('../index.html')).default,
      '/design/social-card.html': (await import('../design/social-card.html'))
        .default,
      '/design/icon.html': (await import('../design/icon.html')).default,
    };
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: Number(process.env.PORT || (preview ? 4173 : 5173)),
  development: preview ? false : { hmr: true, console: false },
  routes,
  async fetch(request) {
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(request.url).pathname);
    } catch {
      return new Response('Invalid URL', { status: 400 });
    }
    const path = resolve(
      root,
      `.${pathname === '/' ? '/index.html' : pathname}`,
    );
    if (!path.startsWith(root + sep))
      return new Response('Not found', { status: 404 });
    const file = Bun.file(path);
    if (!(await file.exists()))
      return new Response('Not found', { status: 404 });
    return new Response(file, {
      headers: path.endsWith('.webmanifest')
        ? { 'Content-Type': 'application/manifest+json' }
        : undefined,
    });
  },
});
console.log(`${preview ? 'Preview' : 'Development'}: ${server.url}`);
