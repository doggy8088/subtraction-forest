import { spawnSync } from 'node:child_process';

for (const [tool, args] of [
  ['typescript/bin/tsc', ['-b']],
  ['vite/bin/vite.js', ['build']],
]) {
  const result = spawnSync(
    process.execPath,
    [`node_modules/${tool}`, ...args],
    {
      encoding: 'utf8',
    },
  );
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  process.stdout.write(output);
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  if (/\b(?:warning|warn)\b|\(!\)/i.test(output)) {
    process.stderr.write('Build warnings must be resolved before release.\n');
    process.exit(1);
  }
}
