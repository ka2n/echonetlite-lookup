export interface ExtractedManufacturer {
  code: string;
  nameJa: string;
  nameEn?: string | null;
}

export interface RawManufacturerData {
  metadata: {
    source: string;
    extractedAt: string;
    sourceFileHash: string;
    recordCount: number;
  };
  manufacturers: Array<{
    code: string;
    nameJa: string;
    nameEn: string | null;
  }>;
}

export interface AppManufacturerData {
  lastUpdated: string;
  source: string;
  total: number;
  manufacturers: Array<{
    code: string;
    nameJa: string;
    nameEn?: string;
  }>;
}

export function normalizeCode(code: string): string {
  // Remove 0x prefix if present
  let normalized = code.replace(/^0x/i, '');

  // Pad with zeros to 6 digits
  normalized = normalized.padStart(6, '0');

  // Convert to uppercase
  return normalized.toUpperCase();
}

export function normalizeCompanyName(name: string): string {
  return name.trim();
}

export function validateManufacturerCode(code: string): boolean {
  // Must be exactly 6 hex digits
  return /^[0-9A-F]{6}$/.test(code);
}

export async function transformToRawData(
  extractedData: ExtractedManufacturer[],
  options: {
    source: string;
    sourceFileHash: string;
  }
): Promise<RawManufacturerData> {
  const manufacturers = extractedData
    .map((item) => ({
      code: normalizeCode(item.code),
      nameJa: normalizeCompanyName(item.nameJa),
      nameEn: item.nameEn ? normalizeCompanyName(item.nameEn) : null,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  // Validate all codes
  const invalidCodes = manufacturers.filter((m) => !validateManufacturerCode(m.code));
  if (invalidCodes.length > 0) {
    throw new Error(
      `Invalid manufacturer codes found: ${invalidCodes.map((m) => m.code).join(', ')}`
    );
  }

  // Check for duplicates
  const codes = new Set<string>();
  const duplicates = manufacturers.filter((m) => {
    if (codes.has(m.code)) {
      return true;
    }
    codes.add(m.code);
    return false;
  });

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate manufacturer codes found: ${duplicates.map((m) => m.code).join(', ')}`
    );
  }

  return {
    metadata: {
      source: options.source,
      extractedAt: new Date().toISOString(),
      sourceFileHash: options.sourceFileHash,
      recordCount: manufacturers.length,
    },
    manufacturers,
  };
}

export function transformToAppData(rawData: RawManufacturerData): AppManufacturerData {
  const today = new Date().toISOString().split('T')[0];

  // Extract base URL from source
  const sourceUrl = rawData.metadata.source.replace(/\/[^\/]*\.pdf$/, '/');

  const manufacturers = rawData.manufacturers.map((m) => {
    const result: { code: string; nameJa: string; nameEn?: string } = {
      code: m.code,
      nameJa: m.nameJa,
    };

    // Only include nameEn if it's not null
    if (m.nameEn) {
      result.nameEn = m.nameEn;
    }

    return result;
  });

  return {
    lastUpdated: today,
    source: sourceUrl,
    total: manufacturers.length,
    manufacturers,
  };
}
