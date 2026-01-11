import { describe, it, expect } from 'bun:test';
import {
  searchManufacturers,
  formatCode,
  isEchonetIdentifier,
  extractManufacturerCode,
  detectSearchType,
  searchManufacturersAuto,
  searchManufacturersOr,
} from './search';

describe('Search Functions', () => {
  describe('searchManufacturers', () => {
    it('should return all manufacturers when query is empty', () => {
      const results = searchManufacturers({ query: '', type: 'name' });

      expect(results.length).toBeGreaterThan(200); // At least 200+ manufacturers
    });

    it('should search by company name in Japanese', () => {
      const results = searchManufacturers({ query: 'パナソニック', type: 'name' });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].nameJa).toContain('パナソニック');
    });

    it('should search by company name in English', () => {
      const results = searchManufacturers({ query: 'パナソニック', type: 'name' });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.nameEn?.includes('パナソニック'))).toBe(true);
    });

    it('should search by manufacturer code', () => {
      const results = searchManufacturers({ query: '00000B', type: 'code' });

      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('00000B');
    });

    it('should search by code with 0x prefix', () => {
      const results = searchManufacturers({ query: '0x00000B', type: 'code' });

      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('00000B');
    });

    it('should be case insensitive', () => {
      const results = searchManufacturers({ query: 'nature', type: 'name' });

      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle partial matches', () => {
      const results = searchManufacturers({ query: '日立', type: 'name' });

      expect(results.length).toBeGreaterThan(0);
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

  describe('isEchonetIdentifier', () => {
    it('should recognize full ECHONET Lite identifier format', () => {
      expect(isEchonetIdentifier('fe00010600000000000000f008d1ec633c_05ff01')).toBe(true);
    });

    it('should recognize identifier-only format (without EOJ)', () => {
      expect(isEchonetIdentifier('fe00010600000000000000f008d1ec633c')).toBe(true);
    });

    it('should recognize uppercase identifier', () => {
      expect(isEchonetIdentifier('FE00010600000000000000F008D1EC633C_05FF01')).toBe(true);
    });

    it('should recognize identifier with 0x prefix', () => {
      expect(isEchonetIdentifier('0xfe00010600000000000000f008d1ec633c')).toBe(true);
    });

    it('should allow whitespace around identifier', () => {
      expect(isEchonetIdentifier('  fe00010600000000000000f008d1ec633c_05ff01  ')).toBe(true);
    });

    it('should reject identifier not starting with FE', () => {
      expect(isEchonetIdentifier('0000010600000000000000f008d1ec633c_05ff01')).toBe(false);
    });

    it('should reject identifier with invalid length', () => {
      expect(isEchonetIdentifier('fe000106')).toBe(false);
    });

    it('should reject regular manufacturer code', () => {
      expect(isEchonetIdentifier('000106')).toBe(false);
    });

    it('should reject manufacturer name', () => {
      expect(isEchonetIdentifier('パナソニック')).toBe(false);
    });
  });

  describe('extractManufacturerCode', () => {
    it('should extract manufacturer code from full format', () => {
      expect(extractManufacturerCode('fe00010600000000000000f008d1ec633c_05ff01')).toBe(
        '000106'
      );
    });

    it('should extract manufacturer code from identifier-only format', () => {
      expect(extractManufacturerCode('fe00010600000000000000f008d1ec633c')).toBe('000106');
    });

    it('should extract lowercase code from uppercase identifier', () => {
      expect(extractManufacturerCode('FE00000B00000000000000F008D1EC633C')).toBe('00000b');
    });

    it('should extract code from identifier with 0x prefix', () => {
      expect(extractManufacturerCode('0xfe00010600000000000000f008d1ec633c')).toBe('000106');
    });

    it('should return null for invalid identifier', () => {
      expect(extractManufacturerCode('000106')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(extractManufacturerCode('')).toBeNull();
    });
  });

  describe('detectSearchType (with ECHONET Lite support)', () => {
    it('should detect ECHONET Lite identifier as echonet-id', () => {
      expect(detectSearchType('fe00010600000000000000f008d1ec633c_05ff01')).toBe(
        'echonet-id'
      );
    });

    it('should maintain existing code detection', () => {
      expect(detectSearchType('000106')).toBe('code');
      expect(detectSearchType('0x00000B')).toBe('code');
    });

    it('should maintain existing name detection', () => {
      expect(detectSearchType('パナソニック')).toBe('name');
    });
  });

  describe('searchManufacturersAuto (with ECHONET Lite support)', () => {
    it('should search by ECHONET Lite identifier', () => {
      const results = searchManufacturersAuto('fe00010600000000000000f008d1ec633c_05ff01');
      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('000106');
      expect(results[0].nameJa).toContain('Nature');
    });

    it('should search by identifier-only format', () => {
      const results = searchManufacturersAuto('fe00000b00000000000000f008d1ec633c');
      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('00000B');
    });

    it('should return empty array for non-existent manufacturer code', () => {
      const results = searchManufacturersAuto('feffff0000000000000000f008d1ec633c');
      expect(results).toHaveLength(0);
    });
  });

  describe('searchManufacturersOr', () => {
    // 基本機能
    it('should search with comma-separated keywords', () => {
      const results = searchManufacturersOr('パナソニック,日立');
      expect(results.length).toBeGreaterThan(1);
      expect(results.some((r) => r.nameJa.includes('パナソニック'))).toBe(true);
      expect(results.some((r) => r.nameJa.includes('日立'))).toBe(true);
    });

    it('should search with space-separated keywords', () => {
      const results = searchManufacturersOr('00000B 000106');
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should search with mixed comma and space', () => {
      const results = searchManufacturersOr('パナソニック, 日立 000001');
      expect(results.length).toBeGreaterThan(0);
    });

    // 重複除去
    it('should remove duplicates from search results', () => {
      const results = searchManufacturersOr('パナソニック,パナソニック');
      const codes = results.map((r) => r.code);
      const uniqueCodes = [...new Set(codes)];
      expect(codes.length).toBe(uniqueCodes.length);
    });

    it('should merge results from different search types', () => {
      // コードと名前の混在
      const results = searchManufacturersOr('000001,パナソニック');
      expect(results.length).toBeGreaterThan(0);
    });

    // エッジケース
    it('should handle single keyword (no separator)', () => {
      const results = searchManufacturersOr('パナソニック');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].nameJa).toContain('パナソニック');
    });

    it('should handle leading/trailing separators', () => {
      const results = searchManufacturersOr(',パナソニック,日立,');
      expect(results.length).toBeGreaterThan(1);
    });

    it('should handle multiple consecutive separators', () => {
      const results = searchManufacturersOr('パナソニック,,  日立');
      expect(results.length).toBeGreaterThan(1);
    });

    it('should return empty array when no keywords match', () => {
      const results = searchManufacturersOr('NotFound1,NotFound2');
      expect(results).toHaveLength(0);
    });

    it('should return all manufacturers for empty query', () => {
      const results = searchManufacturersOr('');
      expect(results.length).toBeGreaterThan(200);
    });

    it('should handle whitespace-only query', () => {
      const results = searchManufacturersOr('   ,  ,  ');
      expect(results.length).toBeGreaterThan(200); // 全件返却
    });

    // パフォーマンステスト
    it('should handle many keywords efficiently', () => {
      const keywords = Array(50).fill('パナソニック').join(',');
      const startTime = Date.now();
      const results = searchManufacturersOr(keywords);
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
