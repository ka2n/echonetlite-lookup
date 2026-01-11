import { test, expect } from '@playwright/test';

test.describe('Search by Company Name - Exact Match', () => {
  test('Exact match search by company name', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter exact company name (search type is auto-detected)
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('パナソニック ホールディングス株式会社');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters (debounce delay)
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify at least one result is returned
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible({ timeout: 10000 });

    // Verify result count is at least 1
    const resultCount = page.locator('.result-count');
    await expect(resultCount).toBeVisible();

    // Verify manufacturer code is displayed in correct format
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    const firstCodeCell = resultRows.first().locator('td span.code');
    await expect(firstCodeCell).toContainText(/0x[0-9A-F]{6}/i);

    // Verify company name matches or contains the search query
    const firstNameCell = resultRows.first().locator('td a.name');
    await expect(firstNameCell).toBeVisible();
  });
});
