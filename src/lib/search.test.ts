import { describe, it, expect } from 'bun:test';

describe('Search Functions', () => {
  describe('searchManufacturers', () => {
    it('should return all manufacturers when query is empty', async () => {
      const { searchManufacturers } = await import('./search');
      const results = searchManufacturers({ query: '', type: 'name' });

      expect(results).toHaveLength(3);
    });

    it('should search by company name in Japanese', async () => {
      const { searchManufacturers } = await import('./search');
      const results = searchManufacturers({ query: 'パナソニック', type: 'name' });

      expect(results).toHaveLength(1);
      expect(results[0].nameJa).toContain('パナソニック');
    });

    it('should search by company name in English', async () => {
      const { searchManufacturers } = await import('./search');
      const results = searchManufacturers({ query: 'Panasonic', type: 'name' });

      expect(results).toHaveLength(1);
      expect(results[0].nameEn).toContain('Panasonic');
    });

    it('should search by manufacturer code', async () => {
      const { searchManufacturers } = await import('./search');
      const results = searchManufacturers({ query: '00007C', type: 'code' });

      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('00007C');
    });

    it('should search by code with 0x prefix', async () => {
      const { searchManufacturers } = await import('./search');
      const results = searchManufacturers({ query: '0x00007C', type: 'code' });

      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('00007C');
    });

    it('should be case insensitive', async () => {
      const { searchManufacturers } = await import('./search');
      const results = searchManufacturers({ query: 'panasonic', type: 'name' });

      expect(results).toHaveLength(1);
    });

    it('should handle partial matches', async () => {
      const { searchManufacturers } = await import('./search');
      const results = searchManufacturers({ query: '日立', type: 'name' });

      expect(results).toHaveLength(1);
      expect(results[0].nameJa).toContain('日立');
    });

    it('should return empty array when no matches found', async () => {
      const { searchManufacturers } = await import('./search');
      const results = searchManufacturers({ query: 'NotFound', type: 'name' });

      expect(results).toHaveLength(0);
    });
  });

  describe('formatCode', () => {
    it('should format code with 0x prefix and uppercase', async () => {
      const { formatCode } = await import('./search');

      expect(formatCode('00007C')).toBe('0x00007C');
      expect(formatCode('00007c')).toBe('0x00007C');
    });
  });
});
