import { test, expect } from '@playwright/test';

test.describe('Results Display', () => {
  test('Results table structure and content', async ({ page }) => {
    // Navigate and perform a search that returns multiple results
    await page.goto('/');

    const searchInput = page.locator('input.search-input');
    const searchButton = page.locator('button.search-button');

    // Search for '0000' to get multiple results (auto-detected as code search)
    await searchInput.fill('0000');
    await searchButton.click();

    // Wait for URL to be updated with query parameters (debounce delay)
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible();

    // Verify table has a header row
    const thead = resultsTable.locator('thead');
    await expect(thead).toBeVisible();

    // Verify table headers are 'メーカーコード' and '企業名'
    const headers = thead.locator('th');
    await expect(headers.nth(0)).toHaveText('メーカーコード');
    await expect(headers.nth(1)).toHaveText('企業名');

    // Verify table body contains result rows
    const tbody = resultsTable.locator('tbody');
    await expect(tbody).toBeVisible();

    const resultRows = tbody.locator('tr');
    const rowCount = await resultRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify each result row has two columns (code and name)
    const firstRow = resultRows.first();
    const cells = firstRow.locator('td');
    await expect(cells).toHaveCount(2);

    // Verify number of rows matches the result count message
    const resultCount = page.locator('.result-count');
    const countText = await resultCount.textContent();
    const displayedCount = parseInt(countText?.match(/(\d+)件/)?.[1] || '0');
    expect(rowCount).toBe(displayedCount);
  });
});
