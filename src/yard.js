// The Yard in a small view beside the code. It draws only while the view shows; its sessions open in the tab.

const vscode = require('vscode');
const crypto = require('crypto');
const { VIEW_VERSION, locate, newEnough, compactSrc, readLook, sessionId, webUrl } = require('./manager');
const { Panel, pageHtml, noticeHtml } = require('./panel');

const VIEW_ID = 'agentGuild.yard';
const LOOK_KEY = 'agentGuild.look';

const OPEN = [['tab', 'Open Agent Guild']];

class YardView {
  constructor(memento, events) {
    this.memento = memento;
    this.events = events;
    this.view = null;
    this.shown = null;
    this.attempt = 0;
    this.status = null;
    // The tab's look, kept for the next time the view opens.
    events.look.event((look) => {
      const last = this.look();
      if (last && last.skin === look.skin && last.theme === look.theme) return;
      this.memento.update(LOOK_KEY, look);
      this.render();
    });
    // The tab reached a manager, maybe a new one.
    events.connected.event(() => this.render());
  }

  look() {
    return readLook(this.memento.get(LOOK_KEY));
  }

  resolveWebviewView(view) {
    this.view = view;
    this.shown = null;
    view.webview.options = { enableScripts: true };
    view.onDidChangeVisibility(() => this.render());
    view.onDidDispose(() => {
      if (this.view !== view) return;
      this.view = null;
      this.shown = null;
    });
    view.webview.onDidReceiveMessage((message) => this.receive(message));
    return this.render();
  }

  /** Show the Yard of the manager running now, unless the view already shows it. */
  async render() {
    const view = this.view;
    if (!view?.visible) return;
    const attempt = ++this.attempt;
    if (!this.shown) this.notice({ state: 'connecting' });
    let state;
    try {
      state = await locate();
    } catch (err) {
      state = { state: 'failed', detail: err.message };
    }
    if (attempt !== this.attempt || this.view !== view || !view.visible) return;
    if (state.state !== 'ready' || !newEnough(state.version, VIEW_VERSION)) return this.notice(state);
    const src = compactSrc(state, this.look());
    if (src === this.shown) return;
    this.shown = src;
    this.status = 'yard';
    view.webview.html = pageHtml(src, state.url, crypto.randomBytes(16).toString('hex'));
  }

  notice(state) {
    this.shown = null;
    this.status = state.state;
    let message;
    if (state.state === 'connecting') message = { title: 'Connecting to Agent Guild…', actions: [] };
    else if (state.state === 'ready' || state.state === 'old') {
      message = {
        title: `The Yard here needs Agent Guild ${VIEW_VERSION} or newer`,
        text: `The running Agent Guild is ${state.version}. Open Agent Guild to update it.`,
        actions: OPEN,
      };
    } else message = { title: 'Agent Guild is not running', text: 'Open Agent Guild to install or start it.', actions: OPEN };
    this.view.webview.html = noticeHtml(message, crypto.randomBytes(16).toString('hex'));
  }

  receive(message) {
    if (message?.kind === 'action') {
      if (message.action === 'tab') Panel.open(this.events);
      return;
    }
    if (message?.kind !== 'page') return;
    if (message.type === 'ready') this.events.viewReady.fire(message.version);
    if (message.type === 'expand') Panel.open(this.events, undefined, sessionId(message.session));
    if (message.type === 'open') {
      const url = webUrl(message.url);
      if (url) vscode.env.openExternal(vscode.Uri.parse(url, true));
    }
  }
}

module.exports = { YardView, VIEW_ID };
