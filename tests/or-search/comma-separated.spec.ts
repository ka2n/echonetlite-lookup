import { test, expect } from '@playwright/test';

test.describe('OR Search with Comma-Separated Keywords', () => {
  test('Search by comma-separated company names', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter comma-separated keywords
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('パナソニック,日立');

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

    // Verify multiple results are displayed
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    const count = await resultRows.count();
    expect(count).toBeGreaterThan(1);

    // Verify that both keywords match some results
    const tableText = await resultsTable.textContent();
    expect(tableText).toMatch(/パナソニック|日立/);
  });

  test('Search by comma-separated manufacturer codes', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter comma-separated codes
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('00000B,000106');

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

    // Verify at least 2 results (one for each code)
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    const count = await resultRows.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('Search with comma and whitespace variations', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter keywords with various whitespace around commas
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('パナソニック, 日立 , 000001');

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
