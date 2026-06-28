import { expect, test } from '@playwright/test';

test('catalog, project notes, wrapper, and offline edition stay connected', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Experiments' })).toBeVisible();
  await expect(page.getByText('Works offline')).toBeVisible();

  await page.goto('/projects/music-graph-study/');
  await expect(page.getByRole('heading', { name: 'Music-Credit Graph Study Lab' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download offline HTML' })).toHaveAttribute(
    'href',
    '/downloads/music-graph-study.html',
  );

  await page.goto('/experiments/music-graph-study/');
  const frame = page.frameLocator('[data-study-frame]');
  const buildTab = frame.getByRole('tab', { name: 'Build plan' });
  const conceptsTab = frame.getByRole('tab', { name: 'Concepts' });
  await expect(buildTab).toHaveAttribute('aria-selected', 'true');
  await conceptsTab.click();
  await expect(conceptsTab).toHaveAttribute('aria-selected', 'true');
  await expect(frame.getByRole('heading', { name: 'Underlying concepts and tools' })).toBeVisible();

  await frame.getByRole('tab', { name: 'Quiz' }).click();
  await frame.locator('input[name="answer"]').first().check();
  await frame.getByRole('button', { name: 'Check' }).click();
  await expect(frame.getByRole('button', { name: 'Next' })).toBeEnabled();
  await expect(frame.locator('input[name="answer"]').first()).toBeDisabled();
  const stored = await frame.locator('body').evaluate(() => localStorage.getItem('musicGraphStudyV5'));
  expect(stored).toBeTruthy();

  await frame.getByRole('tab', { name: 'Flashcards' }).click();
  const reveal = frame.getByRole('button', { name: 'Reveal' });
  await expect(reveal).toHaveAttribute('aria-expanded', 'false');
  await reveal.click();
  await expect(reveal).toHaveAttribute('aria-expanded', 'true');

  await page.goto('/downloads/music-graph-study.html');
  await expect(page.getByText('Offline copy · Music-Credit Graph Study Lab')).toBeVisible();
  await page.getByRole('tab', { name: 'References' }).click();
  await expect(page.getByRole('heading', { name: 'Primary references' })).toBeVisible();
});

test('legacy entry redirects and sitemap lists public landing pages', async ({ page, request }) => {
  await page.goto('/experiments/music-graph-study/music_graph_study_lab_complete_fixed.html');
  await page.waitForURL('**/experiments/music-graph-study/app.html');
  await expect(page.getByRole('heading', { name: /Music-Credit Graph/ })).toBeVisible();

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  expect(xml).toContain('https://lab.erichdonahue.com/projects/music-graph-study/');
  expect(xml).toContain('https://lab.erichdonahue.com/experiments/music-graph-study/');
});
