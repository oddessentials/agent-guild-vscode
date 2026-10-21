import fs from 'node:fs';
import path from 'node:path';

// semantic-release decides the version from the Conventional Commit titles on main;
// this plugin hands that version and its notes to the release workflow.
export async function generateNotes(pluginConfig, { env, lastRelease, nextRelease }) {
  const dir = env.RELEASE_PLAN_DIR;
  if (!dir) throw new Error('RELEASE_PLAN_DIR must name the folder that receives the release plan');
  if (!lastRelease?.version) {
    throw new Error('No release tag was found, so the next version cannot follow from one. Tag the commit before the first release, for example v0.0.0.');
  }
  const install = [
    '### Install or update',
    '',
    'VS Code: [Marketplace](https://marketplace.visualstudio.com/items?itemName=OddEssentials.agent-guild).',
    'Cursor, Windsurf, VSCodium and other editors that use Open VSX: [Open VSX](https://open-vsx.org/extension/OddEssentials/agent-guild).',
    'Editors update extensions by themselves.',
  ].join('\n');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'version'), nextRelease.version);
  fs.writeFileSync(path.join(dir, 'notes.md'), `${[nextRelease.notes, install].filter(Boolean).join('\n\n')}\n`);
  return install;
}
