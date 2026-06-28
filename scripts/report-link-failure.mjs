import { readFile } from 'node:fs/promises';
import process from 'node:process';

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const runUrl = process.env.RUN_URL;
const reportPath = process.env.LINK_REPORT || 'link-report.md';
const title = '[automation] External link check needs attention';

if (!token || !repository) throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required');

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'X-GitHub-Api-Version': '2022-11-28',
};
const api = `https://api.github.com/repos/${repository}`;
const report = await readFile(reportPath, 'utf8');
const body = `${report}\nWorkflow run: ${runUrl || 'unavailable'}\n`;

const issuesResponse = await fetch(`${api}/issues?state=open&per_page=100`, { headers });
if (!issuesResponse.ok) throw new Error(`Could not list issues: ${issuesResponse.status}`);
const issues = await issuesResponse.json();
const existing = issues.find((issue) => !issue.pull_request && issue.title === title);

if (existing) {
  const commentResponse = await fetch(`${api}/issues/${existing.number}/comments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body }),
  });
  if (!commentResponse.ok) throw new Error(`Could not comment on issue: ${commentResponse.status}`);
  console.log(`Updated issue #${existing.number}.`);
} else {
  const createResponse = await fetch(`${api}/issues`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, body }),
  });
  if (!createResponse.ok) throw new Error(`Could not create issue: ${createResponse.status}`);
  const issue = await createResponse.json();
  console.log(`Created issue #${issue.number}.`);
}
