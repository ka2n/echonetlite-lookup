import { test, expect } from '@playwright/test';

test.describe('Page Navigation and Initial Load', () => {
  test('Index page loads successfully', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Verify the page title contains 'ECHONET Lite'
    await expect(page).toHaveTitle(/ECHONET Lite/);

    // Verify the heading is displayed
    const heading = page.locator('h2');
    await expect(heading).toHaveText('ECHONET Lite メーカーコード検索');

    // Verify the description text is present
    const description = page.locator('p');
    await expect(description.first()).toHaveText(
      'ECHONET Liteで使用されるメーカーコードを検索できます'
    );

    // Verify the search form is visible
    const searchForm = page.locator('form.search-form');
    await expect(searchForm).toBeVisible();
  });
});
