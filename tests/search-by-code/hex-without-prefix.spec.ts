import { test, expect } from '@playwright/test';

test.describe('Search by Code Without Prefix', () => {
  test('Search by hexadecimal code without 0x prefix', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter code without 0x prefix (search type is auto-detected)
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('00000B');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters (debounce delay)
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible({ timeout: 10000 });

    // Verify code is displayed in standard format '0x00000B'
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    const codeCell = resultRows.first().locator('td span.code');
    await expect(codeCell).toContainText(/0x00000B/i);

    // Verify results are identical to search with '0x' prefix
    const resultCount = page.locator('.result-count');
    await expect(resultCount).toBeVisible();
  });
});
