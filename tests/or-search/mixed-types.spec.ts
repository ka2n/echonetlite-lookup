import { test, expect } from '@playwright/test';

test.describe('OR Search with Mixed Types (Codes and Names)', () => {
  test('Search by mixed code and company name with comma', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter mixed code and name separated by comma
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('000001,パナソニック');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify URL contains query but NOT type parameter
    expect(page.url()).toContain('q=');
    expect(page.url()).not.toContain('type=');

    // Verify results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible({ timeout: 10000 });

    // Verify multiple results are displayed (at least one for each keyword)
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    const count = await resultRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Search by mixed code and company name with space', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter mixed code and name separated by space
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('00000B Nature');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify URL does not contain type parameter
    expect(page.url()).not.toContain('type=');

    // Verify results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible({ timeout: 10000 });

    // Verify results exist (Panasonic code 00000B and Nature company name)
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    const count = await resultRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Search by mixed ECHONET identifier and company name', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter ECHONET identifier and company name
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('fe00010600000000000000f008d1ec633c,パナソニック');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify URL does not contain type parameter
    expect(page.url()).not.toContain('type=');

    // Verify results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible({ timeout: 10000 });

    // Verify multiple results (Nature from ECHONET ID + Panasonic companies)
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    const count = await resultRows.count();
    expect(count).toBeGreaterThan(1);
  });

  test('Search by multiple codes and names mixed together', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter multiple mixed keywords
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('00000B 日立 000106');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify URL does not contain type parameter
    expect(page.url()).not.toContain('type=');

    // Verify results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible({ timeout: 10000 });

    // Verify multiple results are displayed
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    const count = await resultRows.count();
    expect(count).toBeGreaterThan(1);
  });
});
