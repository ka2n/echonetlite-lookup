import { test, expect } from '@playwright/test';

test.describe('Empty Search Results', () => {
  test('Search with non-existent company name', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter non-existent company name (search type is auto-detected)
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('XYZ不存在企業名123');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters (debounce delay)
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify no results message is displayed
    const noResults = page.locator('.no-results');
    await expect(noResults).toBeVisible({ timeout: 10000 });
    await expect(noResults).toHaveText('該当するメーカーが見つかりませんでした');

    // Verify results table is not displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).not.toBeVisible();

    // Verify search form remains functional
    const searchForm = page.locator('form.search-form');
    await expect(searchForm).toBeVisible();
  });
});
