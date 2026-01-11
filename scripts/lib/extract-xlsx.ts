import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

export interface ExtractedManufacturer {
  code: string;
  nameJa: string;
  nameEn?: string | null;
}

/**
 * Extract manufacturer data from XLSX file
 * @param xlsxPath Path to the XLSX file
 * @returns Array of extracted manufacturers
 */
export async function extractManufacturersFromXlsx(
  xlsxPath: string
): Promise<ExtractedManufacturer[]> {
  // 1. Read XLSX file
  const buffer = readFileSync(xlsxPath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  // 2. Get first sheet
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('No sheets found in XLSX file');
  }

  const worksheet = workbook.Sheets[firstSheetName];

  // 3. Convert to JSON (array format)
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null
  });

  if (rawData.length === 0) {
    throw new Error('XLSX file is empty');
  }

  // 4. Extract data (skip header rows 0-3)
  // Row 0: Title row
  // Row 1: Date row
  // Row 2: Column headers
  // Row 3: Sub-header row
  // Row 4+: Data rows
  const manufacturers: ExtractedManufacturer[] = [];

  for (let i = 4; i < rawData.length; i++) {
    const row = rawData[i];

    // Skip empty rows
    if (!row || row.length < 2) continue;

    const code = row[0]?.toString().trim();
    const nameJa = row[1]?.toString().trim();
    const nameEn = row[2]?.toString().trim();

    // Skip rows without required fields
    if (!code || !nameJa) continue;

    manufacturers.push({
      code,
      nameJa,
      nameEn: nameEn || null
    });
  }

  if (manufacturers.length === 0) {
    throw new Error('No valid manufacturer data found in XLSX file');
  }

  return manufacturers;
}
