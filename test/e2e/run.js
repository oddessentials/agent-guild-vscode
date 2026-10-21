// Opens the tab in a real VS Code against the running manager named by AGENT_GUILD_HOME, and waits for the page's ready message.
// VSCODE_EXECUTABLE uses an installed VS Code instead of downloading stable.
const path = require('path');
const fs = require('fs');
const os = require('os');
const { runTests } = require('@vscode/test-electron');

async function main() {
  if (!process.env.AGENT_GUILD_HOME) throw new Error('Set AGENT_GUILD_HOME to the data folder of a running test manager.');
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-guild-vscode-user-'));
  try {
    await runTests({
      vscodeExecutablePath: process.env.VSCODE_EXECUTABLE || undefined,
      extensionDevelopmentPath: path.resolve(__dirname, '../..'),
      extensionTestsPath: path.resolve(__dirname, 'suite.js'),
      extensionTestsEnv: { AGENT_GUILD_HOME: process.env.AGENT_GUILD_HOME },
      launchArgs: ['--disable-extensions', '--disable-workspace-trust', `--user-data-dir=${userData}`],
    });
  } finally {
    fs.rmSync(userData, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
