import { existsSync } from 'fs';
import { join } from 'path';

export interface CacheEntry {
  url: string;
  lastModified?: string;
  etag?: string;
  size: number;
  downloadedAt: string;
  sha256?: string;
}

export interface CacheMetadata {
  [filename: string]: CacheEntry;
}

export async function loadMetadata(metadataPath: string): Promise<CacheMetadata> {
  if (!existsSync(metadataPath)) {
    return {};
  }

  try {
    const content = await Bun.file(metadataPath).text();
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to load cache metadata: ${error}`);
    return {};
  }
}

export async function saveMetadata(
  metadataPath: string,
  metadata: CacheMetadata
): Promise<void> {
  await Bun.write(metadataPath, JSON.stringify(metadata, null, 2));
}

export async function getCacheEntry(
  cacheDir: string,
  filename: string,
  metadataPath: string
): Promise<CacheEntry | null> {
  const filePath = join(cacheDir, filename);

  if (!existsSync(filePath)) {
    return null;
  }

  const metadata = await loadMetadata(metadataPath);
  const entry = metadata[filename];

  if (!entry) {
    return null;
  }

  return entry;
}

export async function updateCacheEntry(
  metadataPath: string,
  filename: string,
  entry: CacheEntry
): Promise<void> {
  const metadata = await loadMetadata(metadataPath);
  metadata[filename] = entry;
  await saveMetadata(metadataPath, metadata);
}
