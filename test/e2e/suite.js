const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const vscode = require('vscode');
const { VIEW_VERSION, newEnough } = require('../../src/manager');

const READY_WITHIN_MS = 60000;

/** The next event, or a failure naming `what` after `ms`. */
function next(event, what, ms = READY_WITHIN_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      heard.dispose();
      reject(new Error(`${what} did not happen within ${ms / 1000} s.`));
    }, ms);
    const heard = event((value) => {
      clearTimeout(timer);
      heard.dispose();
      resolve(value);
    });
  });
}

async function until(check, what, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const value = await check();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${what} did not happen within ${ms / 1000} s.`);
}

/** How many times `event` fires in the next `ms`: a page that reloads by itself fires `ready` again. */
async function count(event, ms = 3000) {
  let n = 0;
  const heard = event(() => n++);
  await new Promise((resolve) => setTimeout(resolve, ms));
  heard.dispose();
  return n;
}

/**
 * A stand-in manager that answers its health checks as `answers` says, one each and then the last one again,
 * and drops every other request, so its page never loads: a manager that answered and then went away.
 */
async function stub(answers, version = '0.0.0-development') {
  const stand = { checks: 0 };
  const server = http.createServer(async (req, res) => {
    if (!req.url.startsWith('/api/v1/health')) return req.socket.destroy();
    const live = await answers[Math.min(stand.checks++, answers.length - 1)]();
    res.writeHead(live ? 200 : 503, { 'content-type': 'application/json' });
    res.end(JSON.stringify(live ? { ok: true, name: 'agent-guild', version } : { ok: false }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  stand.url = `http://127.0.0.1:${server.address().port}`;
  stand.close = () => new Promise((resolve) => server.close(resolve));
  return stand;
}

/** A promise and the function that settles it. */
function held() {
  let release;
  const promise = new Promise((resolve) => { release = resolve; });
  return { promise, release };
}

/** The test manager's API, with the token from its data folder. */
function managerApi() {
  const home = process.env.AGENT_GUILD_HOME;
  const { url } = JSON.parse(fs.readFileSync(path.join(home, 'manager.json'), 'utf8'));
  const token = fs.readFileSync(path.join(home, 'auth-token'), 'utf8').trim();
  return async (method, route, body) => {
    const res = await fetch(`${url}/api/v1${route}`, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${method} ${route}: ${res.status} ${await res.text()}`);
    return res.json();
  };
}

/** Ask for `session` from the view, as a double-click does, and wait for the tab to attach to it. */
async function expandTo(api, call, what) {
  const { session } = await call('POST', '/sessions', { providerId: 'shell', name: `e2e ${what}` });
  api.yard.receive({ kind: 'page', type: 'expand', session: session.id });
  await until(async () => (await call('GET', `/sessions/${session.id}`)).session.attachedClients > 0, `The tab opening the session (${what})`);
  await call('DELETE', `/sessions/${session.id}`);
}

exports.run = async () => {
  const api = await vscode.extensions.getExtension('OddEssentials.agent-guild').activate();
  const tabReady = next(api.onReady, 'The tab reaching its manager');
  api.open();
  const version = await tabReady;
  assert.equal(await count(api.onReady), 0, 'a healthy tab loads its page once');
  console.log(`Agent Guild ${version} opened in an editor tab, reached its manager and stayed loaded.`);

  if (!newEnough(version, VIEW_VERSION)) {
    await vscode.commands.executeCommand('agentGuild.yard.focus');
    await until(() => api.yard.status === 'ready', 'The view naming the release it needs');
    console.log(`The view asks for Agent Guild ${VIEW_VERSION} or newer.`);
    return;
  }

  const viewReady = next(api.onViewReady, 'The view reaching its manager');
  await vscode.commands.executeCommand('agentGuild.yard.focus');
  await viewReady;
  assert.equal(await count(api.onViewReady), 0, 'a healthy view loads its page once');
  assert.equal(api.yard.status, 'yard');
  assert.match(api.yard.shown, /layout=compact&skin=[a-z]+&theme=(light|dark)$/, 'the view takes the look the tab reported');
  console.log('The view shows the compact Yard in the look of the tab.');

  const call = managerApi();
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  await expandTo(api, call, 'tab closed');
  await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
  await expandTo(api, call, 'tab hidden');
  await expandTo(api, call, 'tab in front');
  console.log('A session asked for from the view opens in the tab, whether the tab was closed, hidden or in front.');

  let readies = 0;
  const counting = api.onViewReady(() => readies++);
  await vscode.commands.executeCommand('workbench.view.search');
  await until(() => !api.yard.view?.visible, 'The view hiding');
  await vscode.commands.executeCommand('agentGuild.yard.focus');
  await until(() => readies > 0, 'The view coming back', READY_WITHIN_MS);
  await new Promise((resolve) => setTimeout(resolve, 3000));
  counting.dispose();
  assert.equal(readies, 1, 'the view loads its page once each time it shows');
  console.log('A hidden view loads its page once when it shows again.');

  const file = path.join(process.env.AGENT_GUILD_HOME, 'manager.json');
  const real = fs.readFileSync(file, 'utf8');
  const pointAt = (url) => fs.writeFileSync(file, JSON.stringify({ ...JSON.parse(real), url }));
  const restore = () => fs.writeFileSync(file, real);
  try {
    // The manager answers the view's check, then is gone before the page loads.
    let gone = await stub([() => true, () => false]);
    pointAt(gone.url);
    api.yard.receive({ kind: 'action', action: 'retry' });
    await until(() => api.yard.status === 'unavailable', 'The view saying Agent Guild stopped responding');
    assert.equal(gone.checks, 2, 'one check to choose the manager, one when its frame loaded');
    restore();
    let back = next(api.onViewReady, 'The view recovering on Retry');
    api.yard.receive({ kind: 'action', action: 'retry' });
    await back;
    assert.equal(api.yard.status, 'yard');
    assert.equal(await count(api.onViewReady), 0, 'a recovered view loads its page once');
    await gone.close();
    console.log('A view whose manager vanished before its page loaded says so, and Retry brings the Yard back.');

    // A check that answers after a newer page loaded changes nothing.
    let late = held();
    gone = await stub([() => true, () => late.promise]);
    pointAt(gone.url);
    api.yard.receive({ kind: 'action', action: 'retry' });
    await until(() => gone.checks === 2, 'The frame check starting');
    restore();
    back = next(api.onViewReady, 'The newer page loading');
    api.yard.receive({ kind: 'action', action: 'retry' });
    await back;
    late.release(false);
    assert.equal(await count(api.onViewReady), 0);
    assert.equal(api.yard.status, 'yard', 'a late failed check does not replace a newer page');
    await gone.close();

    // A check that answers after its view was disposed changes nothing.
    late = held();
    gone = await stub([() => true, () => late.promise]);
    pointAt(gone.url);
    api.yard.receive({ kind: 'action', action: 'retry' });
    await until(() => gone.checks === 2, 'The frame check starting');
    await vscode.commands.executeCommand('agentGuild.yard.removeView');
    await until(() => api.yard.view === null, 'The view being disposed');
    late.release(false);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    assert.equal(api.yard.view, null);
    restore();
    back = next(api.onViewReady, 'The view coming back after it was disposed');
    await vscode.commands.executeCommand('agentGuild.yard.focus');
    await back;
    assert.equal(api.yard.status, 'yard');
    await gone.close();
    console.log('Checks that answer late leave a newer page and a disposed view alone.');

    // The tab: its manager is gone when its page loads and comes back at its old address.
    await vscode.commands.executeCommand('workbench.view.search');
    await until(() => !api.yard.view?.visible, 'The view hiding');
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    gone = await stub([() => true, () => { restore(); return false; }]);
    pointAt(gone.url);
    const tabBack = next(api.onReady, 'The tab recovering');
    api.open();
    await tabBack;
    assert.equal(gone.checks, 2, 'the tab checked the vanished manager once after its frame loaded');
    assert.equal(await count(api.onReady), 0, 'a recovered tab loads its page once');
    await gone.close();
    console.log('A tab whose manager vanished before its page loaded reconnects by itself, once.');

    // The real manager restarts on its port: both pages reconnect by themselves, once each.
    back = next(api.onViewReady, 'The view showing again');
    await vscode.commands.executeCommand('agentGuild.yard.focus');
    await back;
    const tabAgain = next(api.onReady, 'The tab reconnecting after a restart');
    const viewAgain = next(api.onViewReady, 'The view reconnecting after a restart');
    await call('POST', '/shutdown', { force: true, restart: true });
    await Promise.all([tabAgain, viewAgain]);
    const [tabs, views] = await Promise.all([count(api.onReady), count(api.onViewReady)]);
    assert.deepEqual([tabs, views], [0, 0], 'after a restart, neither page reloads again');
    assert.equal(api.yard.status, 'yard');
    console.log('After the manager restarts, the tab and the view each reconnect once.');

    // An upgrade from the tab: the view showed the update notice, and the tab reconnects to the new manager in place.
    const old = await stub([() => true], '1.4.0');
    pointAt(old.url);
    api.yard.receive({ kind: 'action', action: 'retry' });
    await until(() => api.yard.status === 'ready', 'The view asking for an update');
    restore();
    const upgraded = next(api.onViewReady, 'The view showing the Yard after the upgrade');
    await call('POST', '/shutdown', { force: true, restart: true });
    await upgraded;
    assert.equal(api.yard.status, 'yard');
    assert.equal(await count(api.onViewReady), 0, 'the upgraded view loads its page once');
    await old.close();
    console.log('After an upgrade through the tab, the view shows the Yard without being hidden.');
  } finally {
    restore();
  }
};
