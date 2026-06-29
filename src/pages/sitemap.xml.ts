import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

const escapeXml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export const GET: APIRoute = async ({ site }) => {
  if (!site) return new Response('Site URL is not configured.', { status: 500 });

  const experiments = await getCollection('experiments', ({ data }) => data.published);
  const pages = [
    { path: '/', updated: undefined },
    ...experiments.flatMap((experiment) => [
      { path: `/projects/${experiment.data.slug}/`, updated: experiment.data.updated },
      { path: `/experiments/${experiment.data.slug}/`, updated: experiment.data.updated },
    ]),
  ];

  const urls = pages
    .map(({ path, updated }) => {
      const location = escapeXml(new URL(path, site).toString());
      const lastModified = updated ? `<lastmod>${updated.toISOString().slice(0, 10)}</lastmod>` : '';
      return `<url><loc>${location}</loc>${lastModified}</url>`;
    })
    .join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    },
  );
};
