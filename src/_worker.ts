/**
 * Cloudflare Workers + Assets entry point
 * This worker serves static assets from the dist directory
 */

export default {
  async fetch(request, env): Promise<Response> {
    // For Workers + Assets, the default behavior serves assets from the configured directory
    // If you need custom routing or API endpoints, add them here before falling back to assets

    // Example: Add custom headers or handle specific routes
    const url = new URL(request.url);

    // Let the Workers + Assets handle serving the static files
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<{ ASSETS: Fetcher }>;
