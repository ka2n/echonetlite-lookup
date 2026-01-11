import manufacturersData from '../data/manufacturers.json';

export type SearchType = 'code' | 'name' | 'echonet-id';

export interface Manufacturer {
  code: string;
  nameJa: string;
  nameEn?: string;
}

export interface SearchOptions {
  query: string;
  type: SearchType;
}

export function searchManufacturers({ query, type }: SearchOptions): Manufacturer[] {
  const normalizedQuery = query.trim().toLowerCase().replace(/^0x/i, '');

  if (!normalizedQuery) {
    return manufacturersData.manufacturers;
  }

  return manufacturersData.manufacturers.filter((m) => {
    if (type === 'code') {
      return m.code.toLowerCase().includes(normalizedQuery);
    }

    // Name search (Japanese or English)
    return (
      m.nameJa.toLowerCase().includes(normalizedQuery) ||
      m.nameEn?.toLowerCase().includes(normalizedQuery)
    );
  });
}

/**
 * Checks if the input string is an ECHONET Lite identifier format.
 * Format: FE + 16 bytes (32 hex chars) + optional "_" + optional 3 bytes (6 hex chars)
 * Example: fe00010600000000000000f008d1ec633c_05ff01 (41 chars)
 *          fe00010600000000000000f008d1ec633c (34 chars)
 */
export function isEchonetIdentifier(query: string): boolean {
  const trimmed = query.trim().toLowerCase().replace(/^0x/i, '');

  // Pattern 1: Full format (34 hex + _ + 6 hex = 41 chars)
  const fullPattern = /^fe[0-9a-f]{32}_[0-9a-f]{6}$/;

  // Pattern 2: Identifier only (34 hex chars, starts with FE)
  const idOnlyPattern = /^fe[0-9a-f]{32}$/;

  return fullPattern.test(trimmed) || idOnlyPattern.test(trimmed);
}

/**
 * Extracts manufacturer code from ECHONET Lite identifier.
 * Returns bytes 2-4 (characters 2-8) of the identifier.
 * Example: fe000106... → 000106
 */
export function extractManufacturerCode(echonetId: string): string | null {
  const trimmed = echonetId.trim().toLowerCase().replace(/^0x/i, '');

  if (!isEchonetIdentifier(trimmed)) {
    return null;
  }

  // Extract characters 2-8 (bytes 2-4): fe[000106]00000000000000f008d1ec633c
  return trimmed.substring(2, 8);
}

/**
 * Detects the search type based on the query string.
 * Returns 'code' if the query looks like a hexadecimal code (e.g., 000001, 0x00000B),
 * otherwise returns 'name' for company name search.
 */
export function detectSearchType(query: string): SearchType {
  const trimmed = query.trim();
  if (!trimmed) return 'name';

  // ECHONET Lite identifier check (highest priority)
  if (isEchonetIdentifier(trimmed)) {
    return 'echonet-id';
  }

  // Hexadecimal pattern: 0x000001, 00000B, ABCDEF, etc.
  const hexPattern = /^(0x)?[0-9a-fA-F]+$/;
  return hexPattern.test(trimmed) ? 'code' : 'name';
}

/**
 * Searches manufacturers with automatic type detection.
 * Automatically determines whether to search by code or name based on the query.
 */
export function searchManufacturersAuto(query: string): Manufacturer[] {
  const type = detectSearchType(query);

  // ECHONET Lite identifier: extract manufacturer code and search
  if (type === 'echonet-id') {
    const manufacturerCode = extractManufacturerCode(query);
    if (manufacturerCode) {
      return searchManufacturers({ query: manufacturerCode, type: 'code' });
    }
    // Extraction failed: return empty results
    return [];
  }

  return searchManufacturers({ query, type });
}

/**
 * OR検索を実行する。カンマまたはスペースで区切られた複数キーワードを処理。
 * 各キーワードは自動判定で検索され、結果は統合・重複除去される。
 *
 * @param query - カンマまたはスペース区切りのクエリ文字列
 * @returns 重複を除去したメーカーのリスト
 *
 * @example
 * searchManufacturersOr('パナソニック,日立') // 2つの会社を検索
 * searchManufacturersOr('000001 00000B') // 2つのコードを検索
 * searchManufacturersOr('パナソニック,000001') // 名前とコードの混在
 */
export function searchManufacturersOr(query: string): Manufacturer[] {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return manufacturersData.manufacturers;
  }

  const keywords = trimmedQuery.split(/[,\s]+/).filter((k) => k.length > 0);

  if (keywords.length === 0) {
    return manufacturersData.manufacturers;
  }

  if (keywords.length === 1 && keywords[0] !== undefined) {
    return searchManufacturersAuto(keywords[0]);
  }

  // 各キーワードで検索を実行し、重複を除去
  const resultMap = new Map<string, Manufacturer>();

  for (const keyword of keywords) {
    for (const manufacturer of searchManufacturersAuto(keyword)) {
      if (!resultMap.has(manufacturer.code)) {
        resultMap.set(manufacturer.code, manufacturer);
      }
    }
  }

  return Array.from(resultMap.values());
}

export function formatCode(code: string): string {
  return `0x${code.toUpperCase()}`;
}
