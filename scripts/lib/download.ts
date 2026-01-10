import { createHash } from 'crypto';
import { join } from 'path';
import type { CacheEntry } from './cache';
import { getCacheEntry, updateCacheEntry } from './cache';

export interface DownloadOptions {
  url: string;
  filename: string;
  cacheDir: string;
  metadataPath: string;
  maxRetries?: number;
  force?: boolean;
}

export interface DownloadResult {
  status: 'downloaded' | 'cache-hit' | 'error';
  filePath: string;
  size?: number;
  error?: string;
}

export async function calculateSHA256(buffer: Buffer): Promise<string> {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

export async function downloadFile(options: DownloadOptions): Promise<DownloadResult> {
  const { url, filename, cacheDir, metadataPath, maxRetries = 3, force = false } = options;
  const filePath = join(cacheDir, filename);

  // Check cache unless force download is requested
  if (!force) {
    const cacheEntry = await getCacheEntry(cacheDir, filename, metadataPath);

    if (cacheEntry) {
      // Try conditional request
      const headers: Record<string, string> = {};

      if (cacheEntry.lastModified) {
        headers['If-Modified-Since'] = cacheEntry.lastModified;
      }

      if (cacheEntry.etag) {
        headers['If-None-Match'] = cacheEntry.etag;
      }

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, { headers });

          if (response.status === 304) {
            // Not modified, use cache
            return {
              status: 'cache-hit',
              filePath,
              size: cacheEntry.size,
            };
          }

          if (response.status === 200) {
            // Content changed, download new version
            return await saveDownloadedFile(response, filePath, url, filename, metadataPath);
          }

          if (response.status === 404) {
            return {
              status: 'error',
              filePath,
              error: 'File not found (404)',
            };
          }

          // Other errors, retry
          if (attempt === maxRetries) {
            return {
              status: 'error',
              filePath,
              error: `HTTP ${response.status} after ${maxRetries} attempts`,
            };
          }

          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        } catch (error) {
          if (attempt === maxRetries) {
            // Max retries reached, use cache if available
            return {
              status: 'cache-hit',
              filePath,
              size: cacheEntry.size,
              error: `Network error, using cache: ${error}`,
            };
          }

          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  // No cache or force download
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      if (response.status === 200) {
        return await saveDownloadedFile(response, filePath, url, filename, metadataPath);
      }

      if (response.status === 404) {
        return {
          status: 'error',
          filePath,
          error: 'File not found (404)',
        };
      }

      if (attempt === maxRetries) {
        return {
          status: 'error',
          filePath,
          error: `HTTP ${response.status} after ${maxRetries} attempts`,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    } catch (error) {
      if (attempt === maxRetries) {
        return {
          status: 'error',
          filePath,
          error: `Network error after ${maxRetries} attempts: ${error}`,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  return {
    status: 'error',
    filePath,
    error: 'Unexpected download failure',
  };
}

async function saveDownloadedFile(
  response: Response,
  filePath: string,
  url: string,
  filename: string,
  metadataPath: string
): Promise<DownloadResult> {
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await Bun.write(filePath, buffer);

  const sha256 = await calculateSHA256(buffer);
  const lastModified = response.headers.get('last-modified') || undefined;
  const etag = response.headers.get('etag') || undefined;

  const cacheEntry: CacheEntry = {
    url,
    lastModified,
    etag,
    size: buffer.length,
    downloadedAt: new Date().toISOString(),
    sha256,
  };

  await updateCacheEntry(metadataPath, filename, cacheEntry);

  return {
    status: 'downloaded',
    filePath,
    size: buffer.length,
  };
}
