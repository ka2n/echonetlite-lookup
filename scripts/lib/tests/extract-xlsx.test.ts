import { describe, it, expect } from "bun:test";
import { extractManufacturersFromXlsx } from "../extract-xlsx";
import { join } from "path";

const FIXTURE_PATH = join(__dirname, "fixtures", "test-manufacturers.xlsx");

describe("extractManufacturersFromXlsx", () => {
  it("should extract manufacturers from valid XLSX file", async () => {
    const manufacturers = await extractManufacturersFromXlsx(FIXTURE_PATH);

    expect(manufacturers).toBeDefined();
    expect(manufacturers.length).toBe(4); // Only valid rows
  });

  it("should skip header rows correctly", async () => {
    const manufacturers = await extractManufacturersFromXlsx(FIXTURE_PATH);

    // First data row should be row 4 (index 0 in results)
    expect(manufacturers[0].code).toBe("00007C");
    expect(manufacturers[0].nameJa).toBe("シャープ株式会社");
  });

  it("should handle null nameEn correctly", async () => {
    const manufacturers = await extractManufacturersFromXlsx(FIXTURE_PATH);

    const sharpEntry = manufacturers.find((m) => m.code === "00007C");
    expect(sharpEntry).toBeDefined();
    expect(sharpEntry?.nameEn).toBeNull();
  });

  it("should preserve nameEn when present", async () => {
    const manufacturers = await extractManufacturersFromXlsx(FIXTURE_PATH);

    const hitachiEntry = manufacturers.find((m) => m.code === "000001");
    expect(hitachiEntry).toBeDefined();
    expect(hitachiEntry?.nameEn).toBe("2023/3/31 退会");
  });

  it("should skip empty rows", async () => {
    const manufacturers = await extractManufacturersFromXlsx(FIXTURE_PATH);

    // Should only have 4 valid entries, empty rows should be skipped
    expect(manufacturers.length).toBe(4);
  });

  it("should skip rows with missing code", async () => {
    const manufacturers = await extractManufacturersFromXlsx(FIXTURE_PATH);

    // Row with empty code should be skipped
    const missingCodeEntry = manufacturers.find(
      (m) => m.nameJa === "Missing Code"
    );
    expect(missingCodeEntry).toBeUndefined();
  });

  it("should skip rows with missing nameJa", async () => {
    const manufacturers = await extractManufacturersFromXlsx(FIXTURE_PATH);

    // Row with code "INVALID" but no nameJa should be skipped
    const missingNameEntry = manufacturers.find((m) => m.code === "INVALID");
    expect(missingNameEntry).toBeUndefined();
  });

  it("should trim whitespace from fields", async () => {
    const manufacturers = await extractManufacturersFromXlsx(FIXTURE_PATH);

    // All fields should be trimmed
    manufacturers.forEach((m) => {
      expect(m.code).toBe(m.code.trim());
      expect(m.nameJa).toBe(m.nameJa.trim());
      if (m.nameEn) {
        expect(m.nameEn).toBe(m.nameEn.trim());
      }
    });
  });

  it("should throw error for non-existent file", async () => {
    const nonExistentPath = join(__dirname, "fixtures", "non-existent.xlsx");

    expect(async () => {
      await extractManufacturersFromXlsx(nonExistentPath);
    }).toThrow();
  });

  it("should return all expected manufacturers", async () => {
    const manufacturers = await extractManufacturersFromXlsx(FIXTURE_PATH);

    const codes = manufacturers.map((m) => m.code);
    expect(codes).toContain("00007C"); // Sharp
    expect(codes).toContain("000005"); // Toshiba Carrier
    expect(codes).toContain("000001"); // Hitachi
    expect(codes).toContain("00006B"); // ISB
  });
});
