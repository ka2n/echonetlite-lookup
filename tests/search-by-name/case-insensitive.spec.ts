import { test, expect } from '@playwright/test';

test.describe('Partial Match Company Name Search', () => {
  test('Partial match returns consistent results with case insensitive search', async ({ page }) => {
    // First search with shorter query
    await page.goto('/');

    const searchInput = page.locator('input.search-input');
    const searchButton = page.locator('button.search-button');

    // Search for 'nature' (case insensitive, matches Nature company)
    await searchInput.fill('nature');
    await searchButton.click();
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Get the result count for lowercase query
    const resultCount1 = page.locator('.result-count');
    await expect(resultCount1).toBeVisible({ timeout: 10000 });
    const count1Text = await resultCount1.textContent();
    const count1 = parseInt(count1Text?.match(/(\d+)件/)?.[1] || '0');

    // Navigate back to home page
    await page.goto('/');

    // Search for 'Nature' (uppercase - should return same results due to case insensitivity)
    await searchInput.fill('Nature');
    await searchButton.click();
    await page.waitForURL(/\?q=/, { timeout: 10000 });

    // Get the result count for uppercase query
    const resultCount2 = page.locator('.result-count');
    await expect(resultCount2).toBeVisible({ timeout: 10000 });
    const count2Text = await resultCount2.textContent();
    const count2 = parseInt(count2Text?.match(/(\d+)件/)?.[1] || '0');

    // Verify both searches return the same count (case insensitive)
    expect(count2).toBe(count1);
    expect(count2).toBeGreaterThan(0);

    // Verify results are displayed
    const resultsTable = page.locator('table.manufacturer-table');
    await expect(resultsTable).toBeVisible();
  });
});
