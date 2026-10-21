// The editor tab: the manager's own page in a frame, or what stands in its way.

const vscode = require('vscode');
const crypto = require('crypto');
const { MIN_VERSION, YARD_VERSION, PACKAGE, health, locate, newEnough, pageSrc, readLook, webUrl } = require('./manager');

const VIEW_TYPE = 'agentGuild.page';
const NODE_URL = 'https://nodejs.org/en/download';

class Panel {
  /** The one open tab, if any. */
  static current = null;

  /** Bring the tab forward, connecting first if the manager went away or moved, and show `view` or open `session` if asked. */
  static async open(events, view, session) {
    if (Panel.current) {
      Panel.current.panel.reveal();
      return Panel.current.request(view, session);
    }
    const panel = vscode.window.createWebviewPanel(VIEW_TYPE, 'Agent Guild', vscode.ViewColumn.Active, {
      enableScripts: true,
      retainContextWhenHidden: true,
    });
    const tab = new Panel(panel, events);
    tab.view = view;
    tab.session = session;
    return tab.connect();
  }

  /** A tab VS Code brought back after a restart. */
  static revive(panel, events) {
    return new Panel(panel, events).connect();
  }

  constructor(panel, events) {
    Panel.current?.panel.dispose();
    Panel.current = this;
    this.panel = panel;
    this.events = events;
    this.state = null;
    this.connecting = null;
    this.view = null;
    this.session = null;
    panel.iconPath = vscode.Uri.joinPath(vscode.Uri.file(__dirname), '..', 'media', 'icon.png');
    panel.webview.options = { enableScripts: true };
    panel.onDidDispose(() => { if (Panel.current === this) Panel.current = null; });
    panel.webview.onDidReceiveMessage((message) => this.receive(message));
    // A blocked tab checks again when it comes forward, after an update made elsewhere for example.
    panel.onDidChangeViewState(() => {
      if (panel.active && this.state && this.state.state !== 'ready' && this.state.state !== 'connecting') this.connect();
    });
  }

  connect() {
    if (!this.connecting) {
      this.show({ state: 'connecting' });
      this.connecting = locate()
        .then((state) => this.show(state), (err) => this.show({ state: 'failed', detail: err.message }))
        .finally(() => { this.connecting = null; });
    }
    return this.connecting;
  }

  /** Keep the page when its manager still answers at the same address; otherwise connect again. */
  async refresh() {
    if (this.connecting) return this.connecting;
    if (this.state?.state === 'ready' && await health(this.state.url)) return;
    return this.connect();
  }

  /** A view or session asked for while the tab is open: the page is loaded again only if its manager moved. */
  async request(view, session) {
    this.view = view;
    if (session) this.session = session;
    await this.refresh();
    if (this.state?.state !== 'ready') return;
    const asked = this.take();
    if (asked) this.panel.webview.postMessage({ kind: 'view', view: asked });
    const id = this.takeSession();
    if (id) this.panel.webview.postMessage({ kind: 'session', id });
  }

  /** The asked-for view, once. A blocked tab keeps it until the page can show it. */
  take() {
    const view = this.view;
    this.view = null;
    if (!view || newEnough(this.state.version, YARD_VERSION)) return view;
    vscode.window.showInformationMessage(`Opening the Yard from VS Code needs Agent Guild ${YARD_VERSION} or newer. Update Agent Guild, or choose Settings in the tab, then Yard under View.`);
    return null;
  }

  /** The asked-for session, once. A blocked tab keeps it until the page can open it. */
  takeSession() {
    const id = this.session;
    this.session = null;
    return id;
  }

  show(state) {
    this.state = state;
    const nonce = crypto.randomBytes(16).toString('hex');
    if (state.state !== 'ready') {
      this.panel.webview.html = messageHtml(state, nonce);
      return;
    }
    this.panel.webview.html = pageHtml(pageSrc(state, this.take()), state.url, nonce, this.takeSession());
    this.events.connected.fire(state);
  }

  receive(message) {
    if (message?.kind === 'page') {
      if (message.type === 'ready') this.events.ready.fire(message.version);
      if (message.type === 'look') {
        const look = readLook(message);
        if (look) this.events.look.fire(look);
      }
      if (message.type === 'open') {
        const url = webUrl(message.url);
        if (url) vscode.env.openExternal(vscode.Uri.parse(url, true));
      }
      return;
    }
    if (message?.kind !== 'action') return;
    if (message.action === 'retry') this.connect();
    if (message.action === 'install') this.install();
    if (message.action === 'node') vscode.env.openExternal(vscode.Uri.parse(NODE_URL));
    if (message.action === 'browser' && this.state?.url) {
      vscode.env.openExternal(vscode.Uri.parse(`${this.state.url}/#token=${this.state.token}`, true));
    }
  }

  /** npm install in a terminal; with shell integration, the tab connects once it succeeds. */
  install() {
    const command = `npm install -g ${PACKAGE}`;
    const terminal = vscode.window.createTerminal({ name: 'Agent Guild install' });
    terminal.show();
    const execute = (integration) => {
      const execution = integration.executeCommand(command);
      const ended = vscode.window.onDidEndTerminalShellExecution((event) => {
        if (event.execution !== execution) return;
        ended.dispose();
        if (event.exitCode === 0 && Panel.current === this) this.connect();
      });
    };
    if (terminal.shellIntegration) return execute(terminal.shellIntegration);
    if (!vscode.window.onDidChangeTerminalShellIntegration) return terminal.sendText(command);
    // Shell integration starts shortly after the terminal, or not at all.
    const started = vscode.window.onDidChangeTerminalShellIntegration((event) => {
      if (event.terminal !== terminal) return;
      started.dispose();
      clearTimeout(fallback);
      execute(event.shellIntegration);
    });
    const fallback = setTimeout(() => {
      started.dispose();
      terminal.sendText(command);
    }, 3000);
  }
}

const escape = (text) => String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function pageHtml(src, url, nonce, session) {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${url}; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'">
<style>html,body{margin:0;padding:0;height:100%;overflow:hidden}iframe{display:block;border:0;width:100%;height:100%}</style>
</head><body><iframe id="page" title="Agent Guild" src="${escape(src)}" allow="clipboard-read; clipboard-write"></iframe>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
const frame = document.getElementById('page');
const origin = ${JSON.stringify(url)};
// The page listens for requests once it has loaded.
let loaded = false;
const waiting = ${JSON.stringify(session ? [{ type: 'session', id: session }] : [])};
const send = (message) => frame.contentWindow.postMessage({ source: 'agent-guild-vscode', ...message }, origin);
const deliver = (message) => (loaded ? send(message) : waiting.push(message));
frame.addEventListener('load', () => {
  loaded = true;
  waiting.splice(0).forEach(send);
});
// Only the framed page's own messages are passed on.
addEventListener('message', (event) => {
  if (event.source !== frame.contentWindow) {
    const data = event.data;
    if (data?.kind === 'view' && (data.view === 'cards' || data.view === 'yard')) deliver({ type: 'view', view: data.view });
    if (data?.kind === 'session' && typeof data.id === 'string') deliver({ type: 'session', id: data.id });
    return;
  }
  if (event.origin !== origin) return;
  const data = event.data;
  if (!data || data.source !== 'agent-guild') return;
  vscode.postMessage({ kind: 'page', type: data.type, url: data.url, version: data.version, skin: data.skin, theme: data.theme, session: data.session });
});
</script></body></html>`;
}

const MESSAGES = {
  connecting: { title: 'Connecting to Agent Guild…', actions: [] },
  missing: {
    title: 'Agent Guild is not installed',
    text: `Install runs "npm install -g ${PACKAGE}" in a terminal. Agent Guild opens here when it finishes.`,
    actions: [['install', 'Install'], ['retry', 'Try again']],
  },
  'no-node': {
    title: 'Agent Guild needs Node.js',
    text: 'Install Node.js 22 or newer, then try again.',
    actions: [['node', 'Get Node.js'], ['retry', 'Try again']],
  },
  failed: {
    title: 'Agent Guild did not start',
    text: 'Run "agent-guild doctor" in a terminal to see why.',
    actions: [['retry', 'Try again']],
  },
};

function messageHtml(state, nonce) {
  const message = state.state === 'old'
    ? {
      title: 'Agent Guild needs an update',
      text: `The running Agent Guild is ${state.version}; VS Code needs ${MIN_VERSION} or newer. Open it in your browser, choose Update, then restart the manager.`,
      actions: [['browser', 'Open in browser'], ['retry', 'Try again']],
    }
    : MESSAGES[state.state];
  return noticeHtml(message, nonce, state.detail);
}

/** A notice whose buttons post `{ kind: 'action', action }`. */
function noticeHtml(message, nonce, detail) {
  const buttons = message.actions.map(([action, label], i) =>
    `<button class="${i === 0 ? 'primary' : ''}" data-action="${action}">${escape(label)}</button>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'">
<style>
body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);background:var(--vscode-editor-background);display:grid;place-items:center;min-height:100vh;margin:0;padding:0 16px;box-sizing:border-box}
main{max-width:560px}
h1{font-size:1.3em;font-weight:600;margin:0 0 8px}
p{color:var(--vscode-descriptionForeground);line-height:1.5;margin:0 0 16px}
pre{white-space:pre-wrap;font-family:var(--vscode-editor-font-family);font-size:12px;background:var(--vscode-textCodeBlock-background);padding:10px;margin:0 0 16px;overflow:auto;max-height:240px}
button{font:inherit;padding:6px 14px;margin-right:8px;border:1px solid var(--vscode-button-border,transparent);color:var(--vscode-button-secondaryForeground);background:var(--vscode-button-secondaryBackground);cursor:pointer}
button.primary{color:var(--vscode-button-foreground);background:var(--vscode-button-background)}
button:focus-visible{outline:1px solid var(--vscode-focusBorder);outline-offset:2px}
</style></head><body><main>
<h1>${escape(message.title)}</h1>
${message.text ? `<p>${escape(message.text)}</p>` : ''}
${detail ? `<pre>${escape(detail)}</pre>` : ''}
<div>${buttons}</div>
</main>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
for (const button of document.querySelectorAll('button')) {
  button.addEventListener('click', () => vscode.postMessage({ kind: 'action', action: button.dataset.action }));
}
</script></body></html>`;
}

module.exports = { Panel, VIEW_TYPE, pageHtml, noticeHtml };
