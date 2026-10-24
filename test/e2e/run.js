// Opens the tab in a real VS Code against the running manager named by AGENT_GUILD_HOME, and waits for the page's ready message.
// VSIX installs that package and tests it, as users get it; without it, the source folder is loaded.
// VSCODE_VERSION picks the VS Code to download (default stable); VSCODE_EXECUTABLE uses an installed one.
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const { runTests, downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath } = require('@vscode/test-electron');

async function main() {
  if (!process.env.AGENT_GUILD_HOME) throw new Error('Set AGENT_GUILD_HOME to the data folder of a running test manager.');
  const executable = process.env.VSCODE_EXECUTABLE || await downloadAndUnzipVSCode(process.env.VSCODE_VERSION || 'stable');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-guild-vscode-'));
  const extensionsDir = path.join(scratch, 'extensions');
  const userData = path.join(scratch, 'user-data');
  try {
    // Otherwise VS Code replaces the 0.0.0 package under test with the Marketplace release.
    fs.mkdirSync(path.join(userData, 'User'), { recursive: true });
    fs.writeFileSync(path.join(userData, 'User', 'settings.json'), JSON.stringify({ 'extensions.autoUpdate': false, 'extensions.autoCheckUpdates': false }));
    if (process.env.VSIX) {
      const [cli, ...args] = resolveCliArgsFromVSCodeExecutablePath(executable);
      const win = process.platform === 'win32';
      // code.cmd needs a shell on Windows, so every argument is quoted for it.
      const quote = (arg) => (win ? `"${arg}"` : arg);
      const installed = spawnSync(quote(cli), [...args, `--extensions-dir=${extensionsDir}`, '--install-extension', path.resolve(process.env.VSIX)].map(quote),
        { stdio: 'inherit', shell: win });
      if (installed.status !== 0) throw new Error(`Installing ${process.env.VSIX} failed.`);
    }
    await runTests({
      vscodeExecutablePath: executable,
      // With a package installed, the tests run from an empty host extension, so only the package is under test.
      extensionDevelopmentPath: process.env.VSIX ? path.resolve(__dirname, 'host') : path.resolve(__dirname, '../..'),
      extensionTestsPath: path.resolve(__dirname, 'suite.js'),
      extensionTestsEnv: { AGENT_GUILD_HOME: process.env.AGENT_GUILD_HOME, EXPECT_VIEW: process.env.EXPECT_VIEW || '' },
      launchArgs: [`--extensions-dir=${extensionsDir}`, `--user-data-dir=${userData}`, '--disable-workspace-trust'],
    });
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
