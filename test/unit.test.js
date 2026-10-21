const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { VIEW_VERSION, dataDir, readManager, newEnough, startFailure, pageSrc, compactSrc, readLook, sessionId, webUrl } = require('../src/manager');

test('the data folder follows agent-guild on every platform', () => {
  assert.equal(dataDir({ AGENT_GUILD_HOME: 'scratch' }, 'linux', '/home/a'), path.resolve('scratch'));
  assert.equal(dataDir({ APPDATA: 'C:\\Users\\a\\AppData\\Roaming' }, 'win32', 'C:\\Users\\a'), path.join('C:\\Users\\a\\AppData\\Roaming', 'AgentGuild'));
  assert.equal(dataDir({}, 'darwin', '/Users/a'), path.join('/Users/a', 'Library', 'Application Support', 'AgentGuild'));
  assert.equal(dataDir({}, 'linux', '/home/a'), path.join('/home/a', '.config', 'agent-guild'));
});

test('only a loopback manager with a well-formed token is used', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-guild-vscode-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const write = (url, token) => {
    fs.writeFileSync(path.join(dir, 'manager.json'), JSON.stringify({ url }));
    fs.writeFileSync(path.join(dir, 'auth-token'), token);
  };
  const token = 'ab'.repeat(24);
  write('http://127.0.0.1:47821', `${token}\n`);
  assert.deepEqual(readManager(dir), { url: 'http://127.0.0.1:47821', token });
  write('http://evil.example:47821', token);
  assert.equal(readManager(dir), null);
  write('http://127.0.0.1:47821', 'not a token');
  assert.equal(readManager(dir), null);
  fs.rmSync(path.join(dir, 'manager.json'));
  assert.equal(readManager(dir), null);
});

test('the version gate admits the minimum, later releases and development builds', () => {
  assert.equal(newEnough('1.1.1', '1.2.0'), false);
  assert.equal(newEnough('1.2.0', '1.2.0'), true);
  assert.equal(newEnough('1.10.0', '1.2.0'), true);
  assert.equal(newEnough('2.0.0', '1.2.0'), true);
  assert.equal(newEnough('0.0.0-development', '1.2.0'), true);
});

test('the page opens the asked-for view only on a manager whose page can', () => {
  const manager = { url: 'http://127.0.0.1:47821', token: 'ab'.repeat(24) };
  assert.equal(pageSrc({ ...manager, version: '1.3.0' }, 'yard'), `http://127.0.0.1:47821/#token=${manager.token}&view=yard`);
  assert.equal(pageSrc({ ...manager, version: '0.0.0-development' }, 'yard'), `http://127.0.0.1:47821/#token=${manager.token}&view=yard`);
  assert.equal(pageSrc({ ...manager, version: '1.2.0' }, 'yard'), `http://127.0.0.1:47821/#token=${manager.token}`);
  assert.equal(pageSrc({ ...manager, version: '1.3.0' }, null), `http://127.0.0.1:47821/#token=${manager.token}`);
});

test('the small view asks for the compact Yard in the last look of the tab, and only from a manager that has it', () => {
  const manager = { url: 'http://127.0.0.1:47821', token: 'ab'.repeat(24) };
  assert.equal(compactSrc(manager, { skin: 'grove', theme: 'dark' }), `http://127.0.0.1:47821/#token=${manager.token}&layout=compact&skin=grove&theme=dark`);
  assert.equal(compactSrc(manager, null), `http://127.0.0.1:47821/#token=${manager.token}&layout=compact`);
  assert.equal(newEnough('1.4.0', VIEW_VERSION), false);
  assert.equal(newEnough(VIEW_VERSION, VIEW_VERSION), true);
});

test('looks and session ids from a page are taken only when well formed', () => {
  assert.deepEqual(readLook({ skin: 'goblinville', theme: 'light', extra: 1 }), { skin: 'goblinville', theme: 'light' });
  for (const bad of [null, {}, { skin: 'grove' }, { skin: 'grove', theme: 'dim' }, { skin: 'Grove', theme: 'dark' }, { skin: '"><script>', theme: 'dark' }]) {
    assert.equal(readLook(bad), null);
  }
  assert.equal(sessionId('a1b2c3d4e5f6'), 'a1b2c3d4e5f6');
  for (const bad of [undefined, 3, '', '</script>', 'x'.repeat(129)]) assert.equal(sessionId(bad), null);
});

test('links open only as http(s), and a failed start never shows the token', () => {
  assert.equal(webUrl('https://github.com/login/device'), 'https://github.com/login/device');
  for (const bad of ['file:///etc/passwd', 'javascript:alert(1)', 'vscode://settings', 'not a url']) assert.equal(webUrl(bad), null);
  const output = 'Session manager started at http://127.0.0.1:47821\nOpen: http://127.0.0.1:47821/#token=abc\nError: port in use\n';
  assert.equal(startFailure(output), 'Session manager started at http://127.0.0.1:47821\nError: port in use');
});
