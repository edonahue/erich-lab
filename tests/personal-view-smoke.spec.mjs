import { expect, test } from '@playwright/test';

test('personalized view narrows the certification lab to SnowPro', async ({ page }) => {
  await page.goto('/experiments/cloud-data-ai-certification/');
  const frame = page.frameLocator('[data-study-frame]');
  const toggle = frame.getByRole('switch', { name: 'Personalized' });

  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(frame.getByText('SnowPro: close to ready')).toBeVisible();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(frame.getByRole('heading', { name: 'Close to ready—validate once more' })).toBeVisible();
  await expect(frame.getByText('85.4%')).toBeVisible();
  await expect(frame.getByText('88.6%')).toBeVisible();
  await expect(frame.getByRole('tab', { name: 'AI Practitioner' })).toBeHidden();
  await expect(frame.getByRole('tab', { name: 'Solutions Architect' })).toBeHidden();

  await frame.getByRole('tab', { name: 'Resources' }).click();
  await expect(frame.locator('#resourceCert')).toHaveValue('snowpro');

  await page.reload();
  const reloadedFrame = page.frameLocator('[data-study-frame]');
  await expect(reloadedFrame.getByRole('switch', { name: 'Personalized' })).toHaveAttribute('aria-checked', 'true');
});

test('personalized view remains available in the offline edition', async ({ page }) => {
  await page.goto('/downloads/cloud-data-ai-certification.html');
  const toggle = page.getByRole('switch', { name: 'Personalized' });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('heading', { name: 'Close to ready—validate once more' })).toBeVisible();
});
