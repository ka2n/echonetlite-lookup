import { test, expect } from '@playwright/test';

test.describe('Form Interaction', () => {
  test('Form submission via Enter key', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Click in the search input field to focus
    const searchInput = page.locator('input.search-input');
    await searchInput.click();

    // Type a search query
    await searchInput.fill('パナソニック');

    // Press the Enter key
    await searchInput.press('Enter');

    // Wait for URL to be updated with query parameters (debounce delay)
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify URL contains the search query
    expect(decodeURIComponent(page.url())).toContain('q=パナソニック');

    // Verify search results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible();
  });
});
