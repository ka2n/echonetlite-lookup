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

export function calculateSHA256(buffer: Buffer): string {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface FetchContext {
  url: string;
  filePath: string;
  filename: string;
  metadataPath: string;
  maxRetries: number;
  headers?: Record<string, string>;
  cacheEntry?: CacheEntry;
}

async function fetchWithRetry(ctx: FetchContext): Promise<DownloadResult> {
  const { url, filePath, filename, metadataPath, maxRetries, headers, cacheEntry } = ctx;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, headers ? { headers } : undefined);

      if (response.status === 304 && cacheEntry) {
        return {
          status: 'cache-hit',
          filePath,
          size: cacheEntry.size,
        };
      }

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

      await delay(1000 * attempt);
    } catch (error) {
      if (attempt === maxRetries) {
        if (cacheEntry) {
          return {
            status: 'cache-hit',
            filePath,
            size: cacheEntry.size,
            error: `Network error, using cache: ${error}`,
          };
        }
        return {
          status: 'error',
          filePath,
          error: `Network error after ${maxRetries} attempts: ${error}`,
        };
      }

      await delay(1000 * attempt);
    }
  }

  return {
    status: 'error',
    filePath,
    error: 'Unexpected download failure',
  };
}

export async function downloadFile(options: DownloadOptions): Promise<DownloadResult> {
  const { url, filename, cacheDir, metadataPath, maxRetries = 3, force = false } = options;
  const filePath = join(cacheDir, filename);

  // Check cache unless force download is requested
  if (!force) {
    const cacheEntry = await getCacheEntry(cacheDir, filename, metadataPath);

    if (cacheEntry) {
      const headers: Record<string, string> = {};

      if (cacheEntry.lastModified) {
        headers['If-Modified-Since'] = cacheEntry.lastModified;
      }

      if (cacheEntry.etag) {
        headers['If-None-Match'] = cacheEntry.etag;
      }

      return fetchWithRetry({
        url,
        filePath,
        filename,
        metadataPath,
        maxRetries,
        headers,
        cacheEntry,
      });
    }
  }

  // No cache or force download
  return fetchWithRetry({
    url,
    filePath,
    filename,
    metadataPath,
    maxRetries,
  });
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
