import { expect, test } from '@playwright/test';

test('resource credibility ratings and personalized defaults work', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/experiments/cloud-data-ai-certification/app.html');

  await page.getByRole('tab', { name: 'Resources' }).click();
  const credibility = page.locator('#resourceCredibility');
  await expect(credibility).toBeVisible();
  await expect(credibility).toHaveValue('all');

  const officialCard = page.locator('.resource-card').filter({ hasText: 'Official SnowPro practice exam' });
  await expect(officialCard).toBeVisible();
  await expect(officialCard.getByText('Official', { exact: true })).toBeVisible();
  await expect(officialCard.getByText('Core pick', { exact: true })).toBeVisible();
  await expect(officialCard.getByText('Final readiness calibration', { exact: true })).toBeVisible();

  await credibility.selectOption('caution');
  const cautionCard = page.locator('.resource-card').filter({ hasText: 'SkillCertPro SnowPro Core practice tests' });
  await expect(cautionCard).toBeVisible();
  await expect(cautionCard.getByText('Caution', { exact: true })).toBeVisible();
  await expect(cautionCard.getByText('High question-provenance risk', { exact: true })).toBeVisible();

  await page.locator('#personalizedToggle').click();
  await expect(credibility).toHaveValue('recommended');
  await expect(cautionCard).toBeHidden();
  expect(errors).toEqual([]);
});

test('resource credibility layer is packaged into the offline edition', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/downloads/cloud-data-ai-certification.html');
  await page.getByRole('tab', { name: 'Resources' }).click();
  await expect(page.locator('#resourceCredibility')).toBeVisible();
  await page.locator('#resourceCredibility').selectOption('caution');
  await expect(page.getByText('SkillCertPro SnowPro Core practice tests', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
