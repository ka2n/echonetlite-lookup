import { describe, it, expect } from 'bun:test';

describe('Data Transformer', () => {
  describe('normalizeCode', () => {
    it('should remove 0x prefix', async () => {
      const { normalizeCode } = await import('../transform');
      expect(normalizeCode('0x00007C')).toBe('00007C');
    });

    it('should pad with zeros to 6 digits', async () => {
      const { normalizeCode } = await import('../transform');
      expect(normalizeCode('7C')).toBe('00007C');
      expect(normalizeCode('1')).toBe('000001');
    });

    it('should convert to uppercase', async () => {
      const { normalizeCode } = await import('../transform');
      expect(normalizeCode('00007c')).toBe('00007C');
      expect(normalizeCode('0xabcdef')).toBe('ABCDEF');
    });

    it('should handle already normalized codes', async () => {
      const { normalizeCode } = await import('../transform');
      expect(normalizeCode('00007C')).toBe('00007C');
    });
  });

  describe('normalizeCompanyName', () => {
    it('should trim whitespace', async () => {
      const { normalizeCompanyName } = await import('../transform');
      expect(normalizeCompanyName('  パナソニック株式会社  ')).toBe('パナソニック株式会社');
    });

    it('should handle empty strings', async () => {
      const { normalizeCompanyName } = await import('../transform');
      expect(normalizeCompanyName('   ')).toBe('');
    });
  });

  describe('transformToRawData', () => {
    it('should transform extracted data to raw format', async () => {
      const { transformToRawData } = await import('../transform');
      const extractedData = [
        { code: '0x00007C', nameJa: 'パナソニック株式会社', nameEn: 'Panasonic Corporation' },
        { code: '29', nameJa: '株式会社日立製作所', nameEn: null },
      ];

      const result = await transformToRawData(extractedData, {
        source: 'https://echonet.jp/spec_g/list_code.pdf',
        sourceFileHash: 'abc123',
      });

      expect(result.metadata.recordCount).toBe(2);
      expect(result.manufacturers).toHaveLength(2);
      expect(result.manufacturers[0].code).toBe('000029'); // sorted
      expect(result.manufacturers[1].code).toBe('00007C');
    });

    it('should sort manufacturers by code', async () => {
      const { transformToRawData } = await import('../transform');
      const extractedData = [
        { code: '00007C', nameJa: 'パナソニック株式会社' },
        { code: '000029', nameJa: '株式会社日立製作所' },
        { code: '000001', nameJa: 'テスト会社' },
      ];

      const result = await transformToRawData(extractedData, {
        source: 'test',
        sourceFileHash: 'test',
      });

      expect(result.manufacturers[0].code).toBe('000001');
      expect(result.manufacturers[1].code).toBe('000029');
      expect(result.manufacturers[2].code).toBe('00007C');
    });
  });

  describe('transformToAppData', () => {
    it('should transform raw data to app format', async () => {
      const { transformToAppData } = await import('../transform');
      const rawData = {
        metadata: {
          source: 'https://echonet.jp/spec_g/list_code.pdf',
          extractedAt: '2024-01-15T10:30:00Z',
          sourceFileHash: 'abc123',
          recordCount: 2,
        },
        manufacturers: [
          { code: '000029', nameJa: '株式会社日立製作所', nameEn: null },
          { code: '00007C', nameJa: 'パナソニック株式会社', nameEn: 'Panasonic Corporation' },
        ],
      };

      const result = transformToAppData(rawData);

      expect(result.total).toBe(2);
      expect(result.source).toBe('https://echonet.jp/spec_g/');
      expect(result.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.manufacturers).toHaveLength(2);
      expect(result.manufacturers[0]).not.toHaveProperty('nameEn'); // null values removed
      expect(result.manufacturers[1]).toHaveProperty('nameEn');
    });
  });

  describe('validateManufacturerCode', () => {
    it('should validate correct 6-digit hex codes', async () => {
      const { validateManufacturerCode } = await import('../transform');
      expect(validateManufacturerCode('00007C')).toBe(true);
      expect(validateManufacturerCode('ABCDEF')).toBe(true);
      expect(validateManufacturerCode('000000')).toBe(true);
    });

    it('should reject invalid codes', async () => {
      const { validateManufacturerCode } = await import('../transform');
      expect(validateManufacturerCode('7C')).toBe(false); // too short
      expect(validateManufacturerCode('GGGGGG')).toBe(false); // invalid hex
      expect(validateManufacturerCode('0x00007C')).toBe(false); // has prefix
    });
  });
});
