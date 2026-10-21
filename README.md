# Agent Guild for VS Code

Watch your AI coding agents come alive in a 3D world, in a VS Code tab. Claude Code, Codex CLI, Antigravity CLI, Grok Build, Docker Agent and your own shell each get a hall, and every session is a character at work.

![Six real agent sessions in the Guild Yard: the characters walk to their halls and start working, then Claude Code's terminal opens with its three helper agents](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/yard.gif)

## The Yard

- Every session is a character. It works at its tool's hall while its terminal is busy, and walks off to rest when it goes quiet. There is nothing to set up.
- Helper agents appear beside their character: Claude Code's, Codex CLI's and Docker Agent's on their own, Grok Build's once you turn on **Agent reporting** on its card.
- Halls glow while their sessions work, and the roster lists every tool and session.
- Double-click a character to open its real terminal.
- Six worlds: The Guild Yard, Operations Campus, Orbital Station, The Living Grove, Goblinville Works and Gnomeland Village.

![The same six sessions in each of the six worlds](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/worlds.jpg)

To open it, run **Agent Guild: Open the Yard** from the Command Palette. **Agent Guild: Open** then keeps opening the Yard, until you choose **Cards** under **Settings → View** in the tab. Pick a world under **Settings → Skin**.

[Try the Yard in your browser](https://oddessentials.github.io/agent-guild/?view=yard) (simulated, nothing installed), or watch the trailer:

[![Agent Guild: The Yard Update trailer on YouTube](https://i.ytimg.com/vi/Zttp-vs_6z0/maxresdefault.jpg)](https://www.youtube.com/watch?v=Zttp-vs_6z0)

## The tab

- **Agent Guild: Open** in the Command Palette, or **Agent Guild** in the status bar.
- If no session manager is running, one starts. If one is running, the tab connects to it.
- The same sessions stay open in your browser at the same time.
- Closing the tab or VS Code leaves your sessions running. The tab comes back the next time VS Code starts.
- Links open in your default browser.

![Agent Guild opening from the status bar, then a Shell session starting from its card](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/demo.gif)

## Everything else Agent Guild does

Agent Guild runs your coding tools side by side, in real terminals that keep running when the page closes.

- One card per tool: install and update it, start sessions, and see its helper agents and the model in use.
- Two terminals side by side with **Split**.
- Rate-limit meters for Claude Code and Codex CLI.
- Resume a tool's earlier sessions, and see what it remembers and which instruction files it reads.
- Several accounts per tool, and model grades and benchmarks.
- GitHub issues, pull requests and workflow runs for the working folder.
- tmux and herdr sessions that keep running when the manager stops.

![A Claude Code session's terminal, with its helper agents in the header](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/terminal.png)

![Claude Code's earlier sessions, each with a Resume button](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/history.png)

![Claude Code's models with their coding, intelligence and agentic benchmarks](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/models.png)

## Requirements

- Node.js 22 or newer.
- Agent Guild 1.2.0 or newer: `npm install -g @oddessentials/agent-guild`. If it is missing, the tab offers **Install**, which runs that command in a terminal. If it is older, the tab says so and opens it in your browser, where **Update** is. **Agent Guild: Open the Yard** needs 1.3.0 or newer; with 1.2, choose **Settings → View → Yard** in the tab.
- VS Code 1.85 or newer, or an editor built on it.
- For the Yard: WebGL, and a one-time 255 MB download of its art the first time it opens. Everything else keeps working meanwhile, and after that it works offline. Without WebGL, the tab offers **Show Cards**.

The extension has no settings.

From 1.0.0 the version follows semantic versioning: a new major version only when the extension stops supporting a VS Code, Agent Guild or Node.js version listed here.

## Known limits

- While the Agent Guild tab has keyboard focus, VS Code's own shortcuts, such as the Command Palette, go to the page. Click outside the tab to use them.
- Dictate is not offered in the tab. Use it from the browser.
- In a remote window (SSH, WSL, a container), the tab shows the Agent Guild on your own computer, not on the remote one.
- vscode.dev and other editors in a browser are not supported.

## Agent Guild: World

[Agent Guild: World](https://agentguild.oddessentials.ai/), coming soon to Steam, shows the same sessions as a crew at work in a living 3D world, on Windows, macOS and Linux. It runs on Agent Guild, which stays free.

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
