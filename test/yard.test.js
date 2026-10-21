// The Yard view's lifecycle, with VS Code and the manager replaced by doubles the test controls.
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

class Emitter {
  constructor() { this.listeners = []; }
  get event() { return (listener) => { this.listeners.push(listener); return { dispose() {} }; }; }
  fire(value) { for (const listener of [...this.listeners]) listener(value); }
  dispose() {}
}
const vscode = {
  EventEmitter: Emitter,
  Uri: { parse: (value) => value, file: (value) => value, joinPath: (...parts) => parts.join('/') },
  env: { openExternal() {} },
  window: {},
};
const load = Module._load;
Module._load = function (request, ...rest) {
  return request === 'vscode' ? vscode : load.call(this, request, ...rest);
};

const manager = require('../src/manager');
const doubles = { locate: null, health: null, locates: 0 };
manager.locate = () => { doubles.locates++; return doubles.locate(); };
manager.health = (url) => doubles.health(url);
const { YardView } = require('../src/yard');

const settle = async () => { for (let i = 0; i < 5; i++) await new Promise((resolve) => setImmediate(resolve)); };
const running = (version) => ({ state: 'ready', version, url: 'http://127.0.0.1:47821', token: 'ab'.repeat(24) });

/** A view as VS Code resolves it, recording each page or notice it is given. */
function setup() {
  const events = { ready: new Emitter(), viewReady: new Emitter(), look: new Emitter(), connected: new Emitter() };
  const store = new Map();
  const yard = new YardView({ get: (key) => store.get(key), update: (key, value) => store.set(key, value) }, events);
  const visibility = new Emitter();
  const messages = new Emitter();
  const pages = [];
  const view = {
    visible: true,
    webview: {
      options: {},
      set html(value) { pages.push(value); },
      onDidReceiveMessage: messages.event,
    },
    onDidChangeVisibility: visibility.event,
    onDidDispose: () => {},
  };
  const show = (visible) => { view.visible = visible; visibility.fire(); };
  const yards = () => pages.filter((html) => html.includes('<iframe')).length;
  return { yard, events, view, show, pages, yards, send: (message) => messages.fire(message) };
}

test('an upgrade the tab reconnects through replaces the view\'s update notice with the Yard, once', async () => {
  doubles.locate = async () => running('1.4.0');
  doubles.health = async () => true;
  const { yard, events, view, yards } = setup();
  await yard.resolveWebviewView(view);
  await settle();
  assert.equal(yard.status, 'ready', 'a 1.4 manager gets the update notice');

  doubles.locate = async () => running('1.5.0');
  doubles.locates = 0;
  events.ready.fire('1.5.0');
  events.ready.fire('1.5.0');
  await settle();
  assert.equal(yard.status, 'yard');
  assert.equal(doubles.locates, 1, 'repeated ready events start one check');
  assert.equal(yards(), 1);
});

test('the tab reconnecting leaves a view that shows the Yard alone', async () => {
  doubles.locate = async () => running('1.5.0');
  doubles.health = async () => true;
  const { yard, events, view, pages } = setup();
  await yard.resolveWebviewView(view);
  await settle();
  const before = pages.length;
  doubles.locates = 0;
  events.ready.fire('1.5.0');
  await settle();
  assert.equal(doubles.locates, 0);
  assert.equal(pages.length, before, 'no reload');
});

test('a frame check that fails replaces the page, unless the view hid and showed again meanwhile', async () => {
  doubles.locate = async () => running('1.5.0');
  let answer;
  doubles.health = () => new Promise((resolve) => { answer = resolve; });

  const failed = setup();
  await failed.yard.resolveWebviewView(failed.view);
  await settle();
  failed.send({ kind: 'frame', type: 'load', page: failed.yard.page });
  answer(false);
  await settle();
  assert.equal(failed.yard.status, 'unavailable', 'a failed check on the current page says so');

  const restored = setup();
  await restored.yard.resolveWebviewView(restored.view);
  await settle();
  restored.send({ kind: 'frame', type: 'load', page: restored.yard.page });
  restored.show(false);
  restored.show(true);
  await settle();
  answer(false);
  await settle();
  assert.equal(restored.yard.status, 'yard', 'a check from before the view hid changes nothing');
  assert.equal(restored.yards(), 1, 'the restored page is kept');
});
