const assert = require('assert');
const fs = require('fs');
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
  console.log(`Agent Guild ${version} opened in an editor tab and reached its manager.`);

  if (!newEnough(version, VIEW_VERSION)) {
    await vscode.commands.executeCommand('agentGuild.yard.focus');
    await until(() => api.yard.status === 'ready', 'The view naming the release it needs');
    console.log(`The view asks for Agent Guild ${VIEW_VERSION} or newer.`);
    return;
  }

  const viewReady = next(api.onViewReady, 'The view reaching its manager');
  await vscode.commands.executeCommand('agentGuild.yard.focus');
  await viewReady;
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
};
