#!/usr/bin/env bun

import { $ } from 'bun';
import { readdir } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Build the project
await $`bun run build`;

// Find the generated JS and CSS files
const distFiles = await readdir('dist');
const jsFile = distFiles.find(f => f.startsWith('main-') && f.endsWith('.js'));
const cssFile = distFiles.find(f => f.startsWith('main-') && f.endsWith('.css'));

if (!jsFile || !cssFile) {
  console.error('Could not find built JS or CSS files');
  process.exit(1);
}

// Create index.html with correct file references
const html = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="ECHONET Liteメーカーコード検索ツール" />
    <title>ECHONET Lite Lookup</title>

    <!-- Font Preconnect for Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <!-- Google Fonts: DM Sans, JetBrains Mono, Outfit -->
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="/${cssFile}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${jsFile}"></script>
  </body>
</html>
`;

await writeFile(join('dist', 'index.html'), html);
console.log('✅ Build complete with index.html');
