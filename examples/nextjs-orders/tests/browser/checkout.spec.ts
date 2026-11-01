import { test, expect } from '@playwright/test';

test('a member pays a draft order', async ({ page }) => {
  await page.goto('/orders/ord_1');
  await page.getByRole('button', { name: 'Pay' }).click();
  await expect(page.getByText('paid')).toBeVisible();
});
