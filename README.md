# Agent Guild for VS Code

Open [Agent Guild](https://github.com/oddessentials/agent-guild) in an editor tab: launch and watch your AI coding-assistant sessions without leaving your editor.

![Agent Guild in a VS Code editor tab](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/screenshot.png)

- **Agent Guild: Open** in the Command Palette, or **Agent Guild** in the status bar.
- If no session manager is running, one starts. If one is running, the tab connects to it.
- The same sessions stay open in your browser at the same time.
- Closing the tab or VS Code leaves your sessions running. The tab comes back the next time VS Code starts.
- Links open in your default browser.

## Requirements

- Node.js 22 or newer.
- Agent Guild 1.2.0 or newer: `npm install -g @oddessentials/agent-guild`. If it is missing, the tab offers **Install**, which runs that command in a terminal. If it is older, the tab says so and opens it in your browser, where **Update** is.
- VS Code 1.85 or newer, or an editor built on it.

The extension has no settings.

From 1.0.0 the version follows semantic versioning: a new major version only when the extension stops supporting a VS Code, Agent Guild or Node.js version listed here.

## Known limits

- While the Agent Guild tab has keyboard focus, VS Code's own shortcuts, such as the Command Palette, go to the page. Click outside the tab to use them.
- Dictate is not offered in the tab. Use it from the browser.
- In a remote window (SSH, WSL, a container), the tab shows the Agent Guild on your own computer, not on the remote one.
- vscode.dev and other editors in a browser are not supported.

## Development

```
npm ci
npm test
AGENT_GUILD_HOME=<a test data folder> npm run test:e2e
```

`test:e2e` needs a running Agent Guild manager whose data folder is `AGENT_GUILD_HOME`. Start one with `AGENT_GUILD_HOME=<folder> AGENT_GUILD_PORT=47931 agent-guild --no-browser`. Set `VSIX` to test a package built by `npm run package`, and `VSCODE_VERSION` to test another VS Code.

Pull requests are squash-merged, and their titles are Conventional Commits. Merging to main releases a new version when the titles call for one (`fix:` a patch, `feat:` a minor); nobody edits the version.

## License

[PolyForm Shield 1.0.0](LICENSE), as Agent Guild.
