import { test, expect } from '@playwright/test';

test.describe('Search Form Elements', () => {
  test('Search form elements are present and functional', async ({ page }) => {
    // Navigate to the index page
    await page.goto('/');

    // Verify search input field is present with correct placeholder
    const searchInput = page.locator('input.search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      'メーカー名、コード、識別番号を入力（複数検索: カンマまたはスペース区切り）'
    );

    // Verify search button is present with correct text
    const searchButton = page.locator('button.search-button');
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toHaveText('検索');

    // Verify all form elements are enabled
    await expect(searchInput).toBeEnabled();
    await expect(searchButton).toBeEnabled();
  });
});
