import { expect, test } from '@playwright/test';

test('reviewed resource layer loads in the current lab entry', async ({ page, request }) => {
  const appResponse = await request.get('/experiments/cloud-data-ai-certification/app-reviewed.html');
  expect(appResponse.ok()).toBeTruthy();
  const appHtml = await appResponse.text();
  expect(appHtml).toContain('./resource-reviews.js');
  expect(appHtml).toContain('./resource-mode-sync.js');

  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/experiments/cloud-data-ai-certification/app-reviewed.html');
  await page.getByRole('tab', { name: 'Resources' }).click();
  await expect(page.locator('#resourceCredibility')).toBeVisible();
  await expect(page.getByText('Official SnowPro practice exam', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('reviewed resource layer is packaged offline', async ({ page, request }) => {
  const response = await request.get('/downloads/cloud-data-ai-certification.html');
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).toContain('resourceCredibility');
  expect(html).toContain('SkillCertPro SnowPro Core practice tests');
  expect(html).toContain('Final readiness calibration');

  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/downloads/cloud-data-ai-certification.html');
  await page.getByRole('tab', { name: 'Resources' }).click();
  await expect(page.locator('#resourceCredibility')).toBeVisible();
  expect(errors).toEqual([]);
});
