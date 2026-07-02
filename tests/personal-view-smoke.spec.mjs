import { expect, test } from '@playwright/test';

test('personalized view narrows the standalone lab', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/experiments/cloud-data-ai-certification/app.html');

  const toggle = page.locator('#personalizedToggle');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();

  await expect(page.locator('body')).toHaveClass(/is-personalized/);
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.readiness-stat strong').nth(1)).toHaveText('85.4%');
  await expect(page.locator('.readiness-stat strong').nth(2)).toHaveText('88.6%');
  await expect(page.locator('#resourceCert')).toHaveValue('snowpro');
  expect(errors).toEqual([]);
});

test('personalized view is included offline', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/downloads/cloud-data-ai-certification.html');

  const toggle = page.locator('#personalizedToggle').first();
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator('body')).toHaveClass(/is-personalized/);
  await expect(page.getByRole('heading', { name: 'Close to ready—validate once more' }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
