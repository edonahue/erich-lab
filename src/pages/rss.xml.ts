import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

const escapeXml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export const GET: APIRoute = async ({ site }) => {
  if (!site) return new Response('Site URL is not configured.', { status: 500 });

  const experiments = (await getCollection('experiments', ({ data }) => data.published)).sort(
    (a, b) => b.data.updated.getTime() - a.data.updated.getTime(),
  );

  const siteUrl = site.toString().replace(/\/$/, '');
  const feedUrl = `${siteUrl}/rss.xml`;

  const items = experiments
    .map((experiment) => {
      const link = escapeXml(`${siteUrl}/projects/${experiment.data.slug}/`);
      const title = escapeXml(experiment.data.title);
      const description = escapeXml(experiment.data.summary);
      const pubDate = experiment.data.updated.toUTCString();
      const tags = experiment.data.technologies.map((t) => `<category>${escapeXml(t)}</category>`).join('');
      return `<item><title>${title}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><description>${description}</description><pubDate>${pubDate}</pubDate>${tags}</item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Erich&apos;s Lab</title><link>${escapeXml(siteUrl)}/</link><description>Small tools, studies, and working experiments by Erich Donahue.</description><language>en-us</language><atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />${items}</channel></rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
