import { test, expect } from '@playwright/test';

test.describe('Edge Cases', () => {
  test('Special characters in search query', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter special characters in search input
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('株式会社');

    // Submit the search
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters (debounce delay)
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify search completes without errors
    const resultsSection = page.locator('.manufacturer-list');
    await expect(resultsSection).toBeVisible();

    // Verify URL encoding handles special characters properly
    expect(decodeURIComponent(page.url())).toContain('株式会社');

    // Check that results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible();

    // Verify result count is shown
    const resultCount = page.locator('.result-count');
    await expect(resultCount).toBeVisible();
  });
});
