import { test, expect } from '@playwright/test';

test.describe('ECHONET Lite Identifier Edge Cases', () => {
  test('Search by ECHONET Lite identifier with whitespace', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter identifier with whitespace around it
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('  fe00010600000000000000f008d1ec633c_05ff01  ');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Verify results are displayed (whitespace should be trimmed and search succeeds)
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible({ timeout: 10000 });

    // Verify at least one result is displayed
    const resultRows = page.locator('table.manufacturer-table tbody tr');
    await expect(resultRows.first()).toBeVisible();
  });

  test('Search by invalid length identifier (too short)', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter identifier that is too short
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('fe000106');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // This should fall back to regular code search (partial match)
    // Either results are displayed or no results message appears
    const resultsTable = page.locator('table.manufacturer-table');
    const noResults = page.locator('.no-results');

    // Wait for either results table or no results message
    await Promise.race([
      expect(resultsTable).toBeVisible({ timeout: 10000 }).catch(() => {}),
      expect(noResults).toBeVisible({ timeout: 10000 }).catch(() => {})
    ]);

    // Verify that at least one of them is visible
    const hasResults = await resultsTable.isVisible();
    const hasNoResults = await noResults.isVisible();
    expect(hasResults || hasNoResults).toBe(true);
  });

  test('Search by identifier not starting with FE', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Enter identifier not starting with FE (should be treated as regular hex code)
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('0000010600000000000000f008d1ec633c_05ff01');

    // Click the search button
    const searchButton = page.locator('button.search-button');
    await searchButton.click();

    // Wait for URL to be updated with query parameters
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // This should fall back to regular code search (partial match)
    // Either results are displayed or no results message appears
    const resultsTable = page.locator('table.manufacturer-table');
    const noResults = page.locator('.no-results');

    // Wait for either results table or no results message
    await Promise.race([
      expect(resultsTable).toBeVisible({ timeout: 10000 }).catch(() => {}),
      expect(noResults).toBeVisible({ timeout: 10000 }).catch(() => {})
    ]);

    // Verify that at least one of them is visible
    const hasResults = await resultsTable.isVisible();
    const hasNoResults = await noResults.isVisible();
    expect(hasResults || hasNoResults).toBe(true);
  });
});
