import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
if (!process.argv[2]) throw new Error('Pass the output archive path');
const output = resolve(process.argv[2]);
if (existsSync(output)) throw new Error(`Archive already exists: ${output}`);
const stage = mkdtempSync(resolve(tmpdir(), 'folder-tabber-source-'));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const files = [
  'src',
  'public',
  '.githooks',
  'index.html',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'vite.config.ts',
  'vitest.config.ts',
];

try {
  for (const file of files) cpSync(resolve(root, file), resolve(stage, file), { recursive: true });
  writeFileSync(
    resolve(stage, 'README.md'),
    [
      `# FolderTabber ${pkg.version} — Firefox review sources`,
      '',
      `Build environment: Linux (${process.arch}), Node.js ${process.version}, ${pkg.packageManager}.`,
      'The release workflow uses ubuntu-latest. Git and zip are also required.',
      '',
      'Install the pinned pnpm version, then run these commands from this directory:',
      '',
      '```sh',
      `npm install --global ${pkg.packageManager}`,
      'git init --quiet',
      'pnpm install --frozen-lockfile',
      'pnpm build:firefox',
      '```',
      '',
      'git init enables the prepare script to configure the local pre-commit hook.',
      'The unsigned extension files are generated in build-firefox/.',
      'Compare those files with the signed XPI, excluding the META-INF/ signatures added by Mozilla.',
      'No environment variables or credentials are needed to reproduce the build.',
      '',
    ].join('\n'),
  );
  mkdirSync(dirname(output), { recursive: true });
  const result = spawnSync('zip', ['-qr', output, '.'], { cwd: stage, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || 'Could not create the source archive');
  console.log(`Created Firefox review sources: ${output}`);
} finally {
  rmSync(stage, { recursive: true, force: true });
}
