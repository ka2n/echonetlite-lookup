import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadMetadata, saveMetadata, getCacheEntry, type CacheMetadata } from '../cache';

describe('Cache Manager', () => {
  const testCacheDir = '.cache-test';
  const testMetadataPath = join(testCacheDir, 'cache-metadata.json');

  beforeEach(() => {
    if (existsSync(testCacheDir)) {
      rmSync(testCacheDir, { recursive: true });
    }
    mkdirSync(testCacheDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testCacheDir)) {
      rmSync(testCacheDir, { recursive: true });
    }
  });

  describe('loadMetadata', () => {
    it('should return empty object when metadata file does not exist', async () => {
      const metadata = await loadMetadata(testMetadataPath);
      expect(metadata).toEqual({});
    });

    it('should load existing metadata', async () => {
      const testData: CacheMetadata = {
        'test.pdf': {
          url: 'https://example.com/test.pdf',
          lastModified: '2024-01-01T00:00:00Z',
          etag: '"abc123"',
          size: 12345,
          downloadedAt: '2024-01-01T00:00:00Z',
        },
      };
      await Bun.write(testMetadataPath, JSON.stringify(testData, null, 2));

      const metadata = await loadMetadata(testMetadataPath);
      expect(metadata).toEqual(testData);
    });
  });

  describe('saveMetadata', () => {
    it('should save metadata to file', async () => {
      const testData: CacheMetadata = {
        'test.pdf': {
          url: 'https://example.com/test.pdf',
          lastModified: '2024-01-01T00:00:00Z',
          size: 12345,
          downloadedAt: '2024-01-01T00:00:00Z',
        },
      };

      await saveMetadata(testMetadataPath, testData);

      const content = await Bun.file(testMetadataPath).text();
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(testData);
    });
  });

  describe('getCacheEntry', () => {
    it('should return null when file is not cached', async () => {
      const entry = await getCacheEntry(testCacheDir, 'test.pdf', testMetadataPath);
      expect(entry).toBeNull();
    });

    it('should return cache entry when file exists', async () => {
      const testFilePath = join(testCacheDir, 'test.pdf');
      await Bun.write(testFilePath, 'test content');

      const testMetadata: CacheMetadata = {
        'test.pdf': {
          url: 'https://example.com/test.pdf',
          lastModified: '2024-01-01T00:00:00Z',
          size: 12,
          downloadedAt: '2024-01-01T00:00:00Z',
        },
      };
      await Bun.write(testMetadataPath, JSON.stringify(testMetadata));

      const entry = await getCacheEntry(testCacheDir, 'test.pdf', testMetadataPath);

      expect(entry).not.toBeNull();
      expect(entry?.url).toBe('https://example.com/test.pdf');
      expect(entry?.lastModified).toBe('2024-01-01T00:00:00Z');
    });
  });
});
