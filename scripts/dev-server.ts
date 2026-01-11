#!/usr/bin/env bun

import { watch } from 'fs';
import { join } from 'path';

// Store SSE clients for hot reload notifications
const sseClients = new Set<ReadableStreamDefaultController>();

// Build the application once on startup
let buildPromise = buildApp();

async function buildApp() {
  console.log('🔨 Building application...');
  try {
    const result = await Bun.build({
      entrypoints: ['./src/main.tsx'],
      outdir: './dev-dist',
      target: 'browser',
      splitting: true,
      format: 'esm',
      sourcemap: 'inline',
    });

    if (!result.success) {
      console.error('❌ Build failed:', result.logs);
      return false;
    }

    // Generate index.html
    const files = await Array.fromAsync(new Bun.Glob('*.{js,css}').scan({ cwd: './dev-dist' }));
    const jsFile = files.find(f => f.endsWith('.js'));
    const cssFile = files.find(f => f.endsWith('.css'));

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

    ${cssFile ? `<link rel="stylesheet" href="/${cssFile}" />` : ''}
  </head>
  <body>
    <div id="root"></div>
    ${jsFile ? `<script type="module" src="/${jsFile}"></script>` : ''}
    <script>
      // Hot reload via Server-Sent Events
      const eventSource = new EventSource('/__reload');
      eventSource.onmessage = (event) => {
        if (event.data === 'reload') {
          console.log('🔄 Reloading...');
          location.reload();
        }
      };
      eventSource.onerror = () => {
        console.log('❌ Lost connection to dev server');
        eventSource.close();
      };
    </script>
  </body>
</html>
`;

    await Bun.write('./dev-dist/index.html', html);
    console.log('✅ Build complete!');

    // Notify all connected SSE clients to reload
    notifyClients();

    return true;
  } catch (error) {
    console.error('❌ Build error:', error);
    return false;
  }
}

// Notify all SSE clients about a reload
function notifyClients() {
  if (sseClients.size > 0) {
    console.log(`🔄 Notifying ${sseClients.size} client(s) to reload`);
    for (const controller of sseClients) {
      try {
        controller.enqueue(new TextEncoder().encode('data: reload\n\n'));
      } catch (error) {
        // Client disconnected, remove it
        sseClients.delete(controller);
      }
    }
  }
}

// Watch for file changes with debounce
console.log('⚙️  Setting up file watcher for ./src...');
let rebuildTimeout: Timer | null = null;

const watcher = watch('./src', { recursive: true }, async (event, filename) => {
  console.log(`🔍 Watch event: ${event} for ${filename}`);

  // Ignore non-source files
  if (!filename) return;
  if (filename.includes('node_modules')) return;

  // Check if it's in a source directory (even if it's a temp file)
  const isInSourceDir = filename.includes('routes/') ||
                        filename.includes('components/') ||
                        filename.includes('lib/') ||
                        filename.includes('styles/');

  // Check if it's a source file extension
  const isSourceFile = filename.endsWith('.tsx') ||
                       filename.endsWith('.ts') ||
                       filename.endsWith('.css');

  if (isInSourceDir || isSourceFile) {
    console.log(`📝 Triggering rebuild for: ${filename}`);

    // Debounce rebuilds (wait 100ms for file operations to complete)
    if (rebuildTimeout) {
      clearTimeout(rebuildTimeout);
    }

    rebuildTimeout = setTimeout(() => {
      buildPromise = buildApp();
      rebuildTimeout = null;
    }, 100);
  }
});

// Ensure watcher is set up
if (watcher) {
  console.log('✅ File watcher is active');
} else {
  console.error('❌ Failed to set up file watcher');
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // SSE endpoint for hot reload
    if (url.pathname === '/__reload') {
      return new Response(
        new ReadableStream({
          start(controller) {
            // Add client to the set
            sseClients.add(controller);
            console.log(`📱 New SSE client connected (${sseClients.size} total)`);

            // Send initial connection message
            controller.enqueue(new TextEncoder().encode(': connected\n\n'));
          },
          cancel() {
            // Remove client when disconnected
            sseClients.delete(this as any);
            console.log(`📱 SSE client disconnected (${sseClients.size} remaining)`);
          },
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    // Wait for build to complete
    await buildPromise;

    let filePath = url.pathname;

    // Serve root as index.html
    if (filePath === '/' || !filePath.includes('.')) {
      filePath = '/index.html';
    }

    try {
      const file = Bun.file('./dev-dist' + filePath);

      if (await file.exists()) {
        return new Response(file);
      }

      // For SPA routing, serve index.html
      return new Response(Bun.file('./dev-dist/index.html'));
    } catch (error) {
      console.error('Error serving request:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
});

console.log(`🚀 Development server running at http://localhost:${server.port}`);
console.log(`📁 Serving files from: ${process.cwd()}/dev-dist`);
console.log(`👀 Watching for changes in ./src`);
