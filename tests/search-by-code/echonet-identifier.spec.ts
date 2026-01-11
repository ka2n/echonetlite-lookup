import { test, expect } from '@playwright/test';

test.describe('Search by ECHONET Lite Identifier', () => {
  test('Search by full ECHONET Lite identifier format', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter full ECHONET Lite identifier
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('fe00010600000000000000f008d1ec633c_05ff01');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters (debounce delay)
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible({ timeout: 10000 });

    // Verify Nature株式会社 (code: 000106) is found
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    await expect(resultRows.first()).toBeVisible();

    // Verify code is displayed with formatted code '0x000106'
    const codeCell = resultRows.first().locator('td span.code');
    await expect(codeCell).toContainText(/0x000106/i);

    // Verify company name contains 'Nature'
    const nameCell = resultRows.first().locator('td a.name');
    await expect(nameCell).toContainText('Nature');
  });

  test('Search by identifier-only format (without EOJ)', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter identifier-only format (without EOJ part)
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('fe00000b00000000000000f008d1ec633c');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible({ timeout: 10000 });

    // Verify Panasonic (code: 00000B) is found
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    await expect(resultRows.first()).toBeVisible();

    // Verify code is displayed with formatted code '0x00000B'
    const codeCell = resultRows.first().locator('td span.code');
    await expect(codeCell).toContainText(/0x00000B/i);

    // Verify company name contains 'パナソニック'
    const nameCell = resultRows.first().locator('td a.name');
    await expect(nameCell).toContainText('パナソニック');
  });

  test('Search by uppercase ECHONET Lite identifier', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter uppercase identifier
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('FE00010600000000000000F008D1EC633C_05FF01');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible({ timeout: 10000 });

    // Verify at least one result is displayed
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    await expect(resultRows.first()).toBeVisible();
  });

  test('Search by ECHONET Lite identifier with 0x prefix', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter identifier with 0x prefix
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('0xfe00010600000000000000f008d1ec633c');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible({ timeout: 10000 });

    // Verify Nature株式会社 is found
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    await expect(resultRows.first()).toBeVisible();

    const codeCell = resultRows.first().locator('td span.code');
    await expect(codeCell).toContainText(/0x000106/i);
  });

  test('Search by ECHONET Lite identifier with non-existent manufacturer code', async ({
    page,
  }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter identifier with non-existent manufacturer code (FFFFFF)
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('feffff0000000000000000f008d1ec633c_05ff01');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify no results message is displayed
    const noResults = page.locator('.no-results');
    await expect(noResults).toBeVisible({ timeout: 10000 });
  });
});
