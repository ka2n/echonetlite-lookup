import { test, expect } from '@playwright/test';

test.describe('Partial Code Match Search', () => {
  test('Partial code match search', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter partial code (search type is auto-detected)
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('0000');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters (debounce delay)
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify multiple results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible();

    // Verify result count message shows multiple matches
    const resultCount = page.locator('.result-count');
    await expect(resultCount).toBeVisible();
    const countText = await resultCount.textContent();
    const count = parseInt(countText?.match(/(\d+)件/)?.[1] || '0');
    expect(count).toBeGreaterThan(1);

    // Verify all matching codes contain '0000'
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    const rowCount = await resultRows.count();
    expect(rowCount).toBeGreaterThan(1);

    // Verify first few rows contain the search pattern
    for (let i = 0; i < Math.min(3, rowCount); i++) {
      const codeCell = resultRows.nth(i).locator('td span.code');
      const codeText = await codeCell.textContent();
      expect(codeText?.toLowerCase()).toContain('0000');
    }
  });
});
