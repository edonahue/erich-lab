import { expect, test } from '@playwright/test';

test('catalog, project notes, and wrapper stay connected', async ({ page }) => {
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

  const discogsTab = frame.getByRole('tab', { name: 'Discogs' });
  await discogsTab.click();
  await expect(discogsTab).toHaveAttribute('aria-selected', 'true');
  await expect(frame.getByRole('heading', { name: 'Discogs data and project preparation' })).toBeVisible();

  await frame.getByRole('tab', { name: 'Quiz' }).click();
  await frame.locator('input[name="answer"]').first().check();
  await frame.getByRole('button', { name: 'Check' }).click();
  await expect(frame.getByRole('button', { name: 'Next' })).toBeEnabled();
  await expect(frame.locator('input[name="answer"]').first()).toBeDisabled();
  const stored = await frame.locator('body').evaluate(() => localStorage.getItem('musicGraphStudyV6'));
  expect(stored).toBeTruthy();

  await frame.getByRole('tab', { name: 'Flashcards' }).click();
  const reveal = frame.locator('#reveal');
  await expect(reveal).toHaveAttribute('aria-expanded', 'false');
  await reveal.click();
  await expect(reveal).toHaveAttribute('aria-expanded', 'true');
  await expect(reveal).toHaveText('Hide');
});

test('offline edition remains self-contained and interactive', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/downloads/music-graph-study.html');
  await expect(page.getByText('Offline copy · Music-Credit Graph Study Lab')).toBeVisible();
  expect(pageErrors).toEqual([]);

  const discogsTab = page.getByRole('tab', { name: 'Discogs' });
  await discogsTab.click();
  await expect(discogsTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'Discogs data and project preparation' })).toBeVisible();

  const referencesTab = page.getByRole('tab', { name: 'References' });
  await referencesTab.click();
  await expect(referencesTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#references')).not.toHaveAttribute('hidden', '');
  await expect(page.locator('#references h1')).toHaveText('Primary references');

  await page.getByRole('tab', { name: 'Quiz' }).click();
  await page.locator('input[name="answer"]').first().check();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
  expect(pageErrors).toEqual([]);
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
