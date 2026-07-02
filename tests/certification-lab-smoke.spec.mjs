import { expect, test } from '@playwright/test';

test('certification lab project, wrapper, study controls, and local progress work', async ({ page }) => {
  await page.goto('/projects/cloud-data-ai-certification/');
  await expect(page.getByRole('heading', { name: 'Cloud, Data & AI Certification Lab' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download offline HTML' })).toHaveAttribute(
    'href',
    '/downloads/cloud-data-ai-certification.html',
  );

  await page.goto('/experiments/cloud-data-ai-certification/');
  const frame = page.frameLocator('[data-study-frame]');
  const roadmap = frame.getByRole('tab', { name: 'Roadmap' });
  await expect(roadmap).toHaveAttribute('aria-selected', 'true');
  await expect(frame.getByRole('heading', { name: /One coherent sequence/ })).toBeVisible();

  const hours = frame.locator('#hours');
  await hours.fill('8');
  await expect(frame.locator('#hoursOut')).toHaveText('8 hours');

  const checkbox = frame.locator('.task-item input').first();
  await checkbox.check();
  const stored = await frame.locator('body').evaluate(() => localStorage.getItem('cloudDataAiCertificationLabV1'));
  expect(stored).toBeTruthy();

  await frame.getByRole('tab', { name: 'Resources' }).click();
  await frame.locator('#resourceCert').selectOption('snowpro');
  await expect(frame.locator('.resource-card')).toHaveCount(18);

  await frame.getByRole('tab', { name: 'Quiz' }).click();
  await frame.locator('input[name="answer"]').first().check();
  await frame.getByRole('button', { name: 'Check' }).click();
  await expect(frame.getByRole('button', { name: 'Next' })).toBeEnabled();

  await frame.getByRole('tab', { name: 'Flashcards' }).click();
  const reveal = frame.getByRole('button', { name: 'Reveal' });
  await reveal.click();
  await expect(reveal).toHaveAttribute('aria-expanded', 'true');
});

test('certification lab offline edition is self-contained and interactive', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/downloads/cloud-data-ai-certification.html');
  await expect(page.getByText('Offline copy · Cloud, Data & AI Certification Lab')).toBeVisible();
  await page.getByRole('tab', { name: 'AI Practitioner' }).click();
  await expect(page.getByRole('heading', { name: 'AWS Certified AI Practitioner AIF-C01' })).toBeVisible();
  await page.getByRole('tab', { name: 'Quiz' }).click();
  await page.locator('input[name="answer"]').first().check();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
  expect(errors).toEqual([]);
});
