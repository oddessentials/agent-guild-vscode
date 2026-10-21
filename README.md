# Agent Guild for VS Code

Open [Agent Guild](https://github.com/oddessentials/agent-guild) in an editor tab: launch and watch your AI coding-assistant sessions without leaving your editor.

- **Agent Guild: Open** in the Command Palette, or **Agent Guild** in the status bar.
- If no session manager is running, one starts. If one is running, the tab connects to it.
- The same sessions stay open in your browser at the same time.
- Closing the tab or VS Code leaves your sessions running. The tab comes back the next time VS Code starts.
- Links open in your default browser.

## Requirements

- Node.js 22 or newer.
- Agent Guild 1.2.0 or newer: `npm install -g @oddessentials/agent-guild`. If it is missing, the tab offers **Install**, which runs that command in a terminal.

The extension always uses the Agent Guild on your own computer, also in a remote window.

## Development

```
npm ci
npm test
AGENT_GUILD_HOME=<a test data folder> npm run test:e2e
```

`test:e2e` needs a running Agent Guild manager whose data folder is `AGENT_GUILD_HOME`. Start one with `AGENT_GUILD_HOME=<folder> AGENT_GUILD_PORT=47931 agent-guild --no-browser`.

## License

[PolyForm Shield 1.0.0](LICENSE), as Agent Guild.
