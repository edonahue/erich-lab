import { readFile } from 'node:fs/promises';
import process from 'node:process';

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const pullRequestNumber = process.env.PR_NUMBER;
const logPath = process.env.SMOKE_LOG || 'smoke.log';

if (!token || !repository || !pullRequestNumber) {
  throw new Error('GITHUB_TOKEN, GITHUB_REPOSITORY, and PR_NUMBER are required');
}

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'X-GitHub-Api-Version': '2022-11-28',
};
const api = `https://api.github.com/repos/${repository}`;
const text = await readFile(logPath, 'utf8');
const excerpt = text.split(/\r?\n/).slice(-140).join('\n').slice(-20_000);
const body = `### Browser smoke test failure\n\n\`\`\`text\n${excerpt}\n\`\`\``;

const listResponse = await fetch(`${api}/issues/${pullRequestNumber}/comments?per_page=100`, { headers });
if (!listResponse.ok) throw new Error(`Could not list pull request comments: ${listResponse.status}`);
const comments = await listResponse.json();
const existing = comments.find(
  (comment) => comment.user?.login === 'github-actions[bot]' && comment.body?.startsWith('### Browser smoke test failure'),
);

const response = existing
  ? await fetch(`${api}/issues/comments/${existing.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ body }),
    })
  : await fetch(`${api}/issues/${pullRequestNumber}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body }),
    });

if (!response.ok) throw new Error(`Could not report smoke failure: ${response.status}`);
