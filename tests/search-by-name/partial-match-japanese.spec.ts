import { test, expect } from '@playwright/test';

test.describe('Search by Company Name', () => {
  test('Partial match search by Japanese company name', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter search query (search type is auto-detected)
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('日立');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters (debounce delay)
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify URL contains correct query parameters
    expect(decodeURIComponent(page.url())).toContain('q=日立');
    expect(page.url()).not.toContain('type=');

    // Verify results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible();

    // Verify result count message is shown
    const resultCount = page.locator('.result-count');
    await expect(resultCount).toBeVisible();
    await expect(resultCount).toContainText('件のメーカーが見つかりました');

    // Verify at least one result row exists
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    await expect(resultRows.first()).toBeVisible();

    // Verify manufacturer code format (0xXXXXXX)
    const codeCell = resultRows.first().locator('td span.code');
    await expect(codeCell).toContainText(/0x[0-9A-F]{6}/i);

    // Verify company name contains the search term
    const nameCell = resultRows.first().locator('td a.name');
    const nameText = await nameCell.textContent();
    expect(nameText).toBeTruthy();
  });
});
