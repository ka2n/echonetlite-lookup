import { describe, it, expect } from 'bun:test';
import { searchManufacturers, formatCode } from './search';

describe('Search Functions', () => {
  describe('searchManufacturers', () => {
    it('should return all manufacturers when query is empty', () => {
      const results = searchManufacturers({ query: '', type: 'name' });

      expect(results).toHaveLength(3);
    });

    it('should search by company name in Japanese', () => {
      const results = searchManufacturers({ query: 'パナソニック', type: 'name' });

      expect(results).toHaveLength(1);
      expect(results[0].nameJa).toContain('パナソニック');
    });

    it('should search by company name in English', () => {
      const results = searchManufacturers({ query: 'Panasonic', type: 'name' });

      expect(results).toHaveLength(1);
      expect(results[0].nameEn).toContain('Panasonic');
    });

    it('should search by manufacturer code', () => {
      const results = searchManufacturers({ query: '00007C', type: 'code' });

      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('00007C');
    });

    it('should search by code with 0x prefix', () => {
      const results = searchManufacturers({ query: '0x00007C', type: 'code' });

      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('00007C');
    });

    it('should be case insensitive', () => {
      const results = searchManufacturers({ query: 'panasonic', type: 'name' });

      expect(results).toHaveLength(1);
    });

    it('should handle partial matches', () => {
      const results = searchManufacturers({ query: '日立', type: 'name' });

      expect(results).toHaveLength(1);
      expect(results[0].nameJa).toContain('日立');
    });

    it('should return empty array when no matches found', () => {
      const results = searchManufacturers({ query: 'NotFound', type: 'name' });

      expect(results).toHaveLength(0);
    });
  });

  describe('formatCode', () => {
    it('should format code with 0x prefix and uppercase', () => {
      expect(formatCode('00007C')).toBe('0x00007C');
      expect(formatCode('00007c')).toBe('0x00007C');
    });
  });
});
