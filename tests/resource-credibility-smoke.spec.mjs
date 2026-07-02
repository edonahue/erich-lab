import { expect, test } from '@playwright/test';

test('reviewed lab entry and offline artifact are generated', async ({ request }) => {
  const appResponse = await request.get('/experiments/cloud-data-ai-certification/app-reviewed.html');
  expect(appResponse.ok()).toBeTruthy();
  expect(await appResponse.text()).toContain('./resource-reviews.js');

  const offlineResponse = await request.get('/downloads/cloud-data-ai-certification.html');
  expect(offlineResponse.ok()).toBeTruthy();
  const offlineHtml = await offlineResponse.text();
  expect(offlineHtml).toContain('resourceCredibility');
  expect(offlineHtml).toContain('Final readiness calibration');
});
