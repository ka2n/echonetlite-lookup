import { test, expect } from '@playwright/test';

test.describe('Search by Manufacturer Code', () => {
  test('Search by complete hexadecimal code with 0x prefix', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter manufacturer code with 0x prefix (search type is auto-detected)
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('0x00000B');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters (debounce delay)
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify URL does not contain type parameter
    expect(page.url()).not.toContain('type=');

    // Verify results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible({ timeout: 10000 });

    // Verify manufacturer with code '00000B' is found
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    await expect(resultRows.first()).toBeVisible();

    // Verify code is displayed with formatted code '0x00000B'
    const codeCell = resultRows.first().locator('td span.code');
    await expect(codeCell).toContainText(/0x00000B/i);

    // Verify company name is displayed
    const nameCell = resultRows.first().locator('td a.name');
    await expect(nameCell).toBeVisible();
  });
});
