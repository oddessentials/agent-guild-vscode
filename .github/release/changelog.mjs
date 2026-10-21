// Writes CHANGELOG.md, shown on the Marketplace's Changelog tab, from the GitHub releases.
// The releases are the record, so the file is generated when packaging and never committed.
// usage: node .github/release/changelog.mjs <out> [<version> <notes.md>]  (GH_TOKEN, GH_REPO)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const [out, version, notesFile] = process.argv.slice(2);
const gh = (...args) => JSON.parse(execFileSync('gh', args, { encoding: 'utf8' }));

const releases = gh('release', 'list', '--limit', '200', '--exclude-drafts', '--json', 'tagName,publishedAt')
  .map(({ tagName, publishedAt }) => ({ title: tagName.replace(/^v/, ''), date: publishedAt.slice(0, 10), body: gh('release', 'view', tagName, '--json', 'body').body }));
if (version && notesFile) releases.unshift({ title: version, date: new Date().toISOString().slice(0, 10), body: fs.readFileSync(notesFile, 'utf8') });

// Each release's notes begin with their own version heading; the changelog gives one per release instead.
const body = (text) => text.replace(/^#{1,3} \[?\d+\.\d+\.\d+.*\n+/, '').trim();
const sections = releases.map((r) => `## ${r.title} (${r.date})\n\n${body(r.body) || 'No notes.'}`);
fs.writeFileSync(out, `# Changelog\n\n${sections.join('\n\n')}\n`);
console.log(`${out}: ${releases.length} release(s)`);
