import { readFile } from 'node:fs/promises';
import process from 'node:process';

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const pullRequestNumber = process.env.PR_NUMBER;
const logPath = process.env.SMOKE_LOG || 'smoke.log';

if (!token || !repository || !pullRequestNumber) {
  throw new Error('GITHUB_TOKEN, GITHUB_REPOSITORY, and PR_NUMBER are required');
}

const text = await readFile(logPath, 'utf8');
const lines = text.split('\r?\n');
const excerpt = lines.slice(-140).join('\n').slice(-20_000);
const body = `### Browser smoke test failure\n\n\`\`\`text\n${excerpt}\n\`\`\``;
const response = await fetch(`https://api.github.com/repos/${repository}/issues/${pullRequestNumber}/comments`, {
  method: 'POST',
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
  body: JSON.stringify({ body }),
});

if (!response.ok) throw new Error(`Could not post smoke failure: ${response.status}`);
console.log('Posted browser smoke failure details to the pull request.');
