# Agent Guild for VS Code

Watch every coding-agent session come alive as a character in a 3D world, in a VS Code tab or right beside your code. Claude Code, Codex CLI, Antigravity CLI, Grok Build and Docker Agent run side by side in real terminals, each on your own account, as in any terminal.

[![Six real agent sessions in the Guild Yard: the characters walk to their halls and start working, then Claude Code's terminal opens with its three helper agents](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/yard.gif)](https://oddessentials.github.io/agent-guild/?view=yard&skin=guild&theme=dark)

**[Try it in your browser](https://oddessentials.github.io/agent-guild/?view=yard&skin=guild&theme=dark)**: simulated, free, no account and nothing installed.

## Get started

1. Install this extension.
2. Click **Agent Guild** in the status bar, or open **Agent Guild** in the Explorer.
3. If Agent Guild isn't installed yet, choose **Install**. It runs `npm install -g @oddessentials/agent-guild` in a terminal and connects when it finishes.

Press **New** on a tool's card to start a session, and sign in to the tool there the first time.

## Your coding agents, side by side

- Real terminals that keep running when you close the tab or VS Code. The tab comes back the next time VS Code starts.
- Rate-limit meters for Claude Code and Codex CLI, so you know how much headroom is left.
- Each session's helper agents and model, live on its card.
- Two sessions at once with **Split**, and earlier conversations back with **Resume**.

| | Install from its card | Helper agents | Rate-limit meter | Resume | Several accounts | Model benchmarks |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| Claude Code | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Codex CLI | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Antigravity CLI | Shows the command | | | ✓ | | ✓ |
| Grok Build | ✓ | With **Agent reporting** | | ✓ | ✓ | ✓ |
| Docker Agent | ✓ | ✓ | | ✓ | | |

The **Shell** card runs your own shell, plus tmux (macOS and Linux) and herdr sessions that keep running when Agent Guild stops. Helper agents need a recent version of each tool: [setup per tool](https://github.com/oddessentials/agent-guild/blob/main/docs/agent-reporting.md).

## Watch them work: the Yard

- Every session is a character. It works at its tool's hall while its terminal is busy, and walks off to rest when it goes quiet. There is nothing to set up.
- Helper agents gather beside their character, and halls glow while their sessions work.
- Double-click a character to open its real terminal.
- Six worlds: The Guild Yard, Operations Campus, Orbital Station, The Living Grove, Goblinville Works and Gnomeland Village.

![The same six sessions in each of the six worlds](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/worlds.jpg)

Run **Agent Guild: Open the Yard**, and pick a world under **Settings → Skin**. [Try the Yard in your browser](https://oddessentials.github.io/agent-guild/?view=yard) (simulated, nothing installed), or watch the trailer:

[![Agent Guild: The Yard Update trailer on YouTube](https://i.ytimg.com/vi/Zttp-vs_6z0/maxresdefault.jpg)](https://www.youtube.com/watch?v=Zttp-vs_6z0)

## The Yard beside your code

Keep your agents in view while you work. Open **Agent Guild** in the Explorer, or drag it to the bottom panel.

![VS Code with the Agent Guild view in the Explorer showing the Guild Yard beside a TypeScript file, with Claude Code, Codex CLI, Antigravity CLI, Grok Build and Shell sessions at their halls (demo sessions)](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/view.png)

_Shown with demo sessions._

- It shows the Yard in the world and theme you chose in the tab.
- Double-click a character to open its terminal in the Agent Guild tab.
- It draws nothing while it's collapsed or hidden.

## The Agent Guild tab

- Opens from the status bar or **Agent Guild: Open**, and starts Agent Guild if it isn't running.
- The same sessions stay open in your browser at the same time.
- Links open in your default browser.

![Agent Guild opening from the status bar, then a Shell session starting from its card](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/demo.gif)

## More in Agent Guild

- See what Claude Code, Codex CLI and Grok Build remember, and which instruction files your tools read in the working folder.
- Grades and benchmarks for your tools' models.
- GitHub issues, pull requests, workflow runs and branches for your working folder, once you sign in to GitHub.

![A Claude Code session's terminal, with its helper agents in the header](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/terminal.png)

![Claude Code's earlier sessions, each with a Resume button](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/history.png)

![Claude Code's models with their coding, intelligence and agentic benchmarks](https://raw.githubusercontent.com/oddessentials/agent-guild-vscode/main/media/models.png)

## Commands

| Command | What it does |
| --- | --- |
| **Agent Guild: Open**, or **Agent Guild** in the status bar | Opens the tab, in the view you last chose |
| **Agent Guild: Open the Yard** | Opens the tab straight into the Yard |
| **Agent Guild** in the Explorer | The Yard beside your code |

There are no settings to configure.

## Requirements

- VS Code 1.85 or newer, or an editor built on it.
- Node.js 22 or newer.
- Agent Guild, installed with `npm install -g @oddessentials/agent-guild` or **Install** in the tab.
- For the Yard: WebGL, and a one-time download of about 255 MB of art the first time it opens. After that it works offline.

| Feature | Agent Guild |
| --- | --- |
| The tab | 1.2.0 or newer |
| **Agent Guild: Open the Yard** | 1.3.0 or newer |
| The Yard beside your code | 1.5.0 or newer |

With an older Agent Guild, the tab or the view says which update it needs.

From 1.0.0 the version follows semantic versioning: a new major version only when the extension stops supporting a VS Code, Agent Guild or Node.js version listed here.

## Troubleshooting

| You see | What to do |
| --- | --- |
| Agent Guild is not installed | Choose **Install**. The tab connects when it finishes. |
| Agent Guild is not running | Choose **Open Agent Guild**, which starts it or offers **Install**. |
| Agent Guild needs Node.js | Install Node.js 22 or newer, then choose **Try again**. |
| Agent Guild did not start | Run `agent-guild doctor` in a terminal to see why. |
| Agent Guild needs an update | Choose **Open in browser**, then **Update** there. |
| Agent Guild stopped responding | Choose **Retry** once it's running again, or **Open Agent Guild** to start it. |

## Known limits

- While the Agent Guild tab or view has keyboard focus, VS Code's own shortcuts, such as the Command Palette, go to the page. Click outside it to use them.
- **Dictate** works in the browser, not in VS Code.
- In a remote window (SSH, WSL, a container), the tab and the view show the Agent Guild on your own computer, not on the remote one.
- vscode.dev and other editors in a browser are not supported.

## Privacy

The extension talks only to the Agent Guild on your own computer, and collects no telemetry. Neither does Agent Guild: [its privacy section](https://github.com/oddessentials/agent-guild#privacy) lists what it fetches, such as version checks and usage meters, and none of it carries your code or prompts.

## Agent Guild: World

[Agent Guild: World](https://store.steampowered.com/app/5462970/Agent_Guild_World/) shows the same sessions as a crew at work in a living 3D world, free on Steam for Windows, macOS and Linux. [Wishlist it on Steam](https://store.steampowered.com/app/5462970/Agent_Guild_World/).

Agent Guild also opens your sessions on [Apple Vision Pro](https://apps.apple.com/us/app/agent-guild-remote/id6825451331), [Android](https://github.com/oddessentials/agent-guild-android/releases/latest) and any browser. Follow along on [YouTube](https://www.youtube.com/@Agent-Guild) and [X](https://x.com/agentguild_3d), or visit [the website](https://agentguild.oddessentials.ai/).

## Development

```
npm ci
npm test
AGENT_GUILD_HOME=<a test data folder> npm run test:e2e
```

`test:e2e` needs a running Agent Guild manager whose data folder is `AGENT_GUILD_HOME`. Start one with `AGENT_GUILD_HOME=<folder> AGENT_GUILD_PORT=47931 agent-guild --no-browser`. Set `VSIX` to test a package built by `npm run package`, and `VSCODE_VERSION` to test another VS Code.

Pull requests are squash-merged, and their titles are Conventional Commits. Merging to main releases a new version when the titles call for one (`fix:` a patch, `feat:` a minor); nobody edits the version.

## License

Copyright (c) 2026 Odd Essentials. Free to use, and open source under the [GNU AGPL 3.0](LICENSE), like Agent Guild.

Claude Code, Codex, Antigravity, Grok and Docker are trademarks of Anthropic, OpenAI, Google, xAI and Docker. Agent Guild is not affiliated with or endorsed by them.
