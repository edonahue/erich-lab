import { expect, test } from '@playwright/test';

test('personalized runtime is wired into online and offline artifacts', async ({ page, request }) => {
  const appResponse = await request.get('/experiments/cloud-data-ai-certification/app.html');
  expect(appResponse.ok()).toBeTruthy();
  expect(await appResponse.text()).toContain('./profile.js');

  const offlineResponse = await request.get('/downloads/cloud-data-ai-certification.html');
  expect(offlineResponse.ok()).toBeTruthy();
  const offlineHtml = await offlineResponse.text();
  expect(offlineHtml).toContain('personalizedToggle');
  expect(offlineHtml).toContain('Close to ready—validate once more');

  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/experiments/cloud-data-ai-certification/app.html');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});
