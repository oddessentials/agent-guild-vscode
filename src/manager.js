// Finding, starting and checking the local Agent Guild session manager. No VS Code API here.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

/** The first manager whose page VS Code may frame and that talks to this extension. */
const MIN_VERSION = '1.2.0';
/** The first manager whose page opens the view VS Code asks for. */
const YARD_VERSION = '1.3.0';
/** The first manager whose page can fill a small view with the Yard. */
const VIEW_VERSION = '1.5.0';
const PACKAGE = '@oddessentials/agent-guild';

/** The manager's per-user data folder, by the same rules as agent-guild's src/manager/config.mjs. */
function dataDir(env = process.env, platform = process.platform, home = os.homedir()) {
  if (env.AGENT_GUILD_HOME) return path.resolve(env.AGENT_GUILD_HOME);
  if (platform === 'win32') return path.join(env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'AgentGuild');
  if (platform === 'darwin') return path.join(home, 'Library', 'Application Support', 'AgentGuild');
  return path.join(env.XDG_CONFIG_HOME || path.join(home, '.config'), 'agent-guild');
}

/** The running manager's loopback address and token, or null. */
function readManager(dir = dataDir()) {
  try {
    const { url } = JSON.parse(fs.readFileSync(path.join(dir, 'manager.json'), 'utf8'));
    const token = fs.readFileSync(path.join(dir, 'auth-token'), 'utf8').trim();
    if (typeof url !== 'string' || !/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d{1,5}$/.test(url)) return null;
    if (!/^[a-f0-9]{32,}$/.test(token)) return null;
    return { url, token };
  } catch {
    return null;
  }
}

/** The version of the Agent Guild manager answering at `url`, or null. */
async function health(url) {
  try {
    const res = await fetch(`${url}/api/v1/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.name === 'agent-guild' && typeof body.version === 'string' ? body.version : null;
  } catch {
    return null;
  }
}

/** True for MIN_VERSION or later, and for a development build. */
function newEnough(version, min = MIN_VERSION) {
  if (/^0\.0\.0(-|$)/.test(version)) return true;
  const parts = (v) => v.split(/[-+]/)[0].split('.').map((n) => Number.parseInt(n, 10) || 0);
  const [a, b] = [parts(version), parts(min)];
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
}

function run(command, args) {
  return new Promise((resolve) => {
    let output = '';
    let child;
    try {
      // A shell finds npm's .cmd launchers on Windows; the arguments are fixed.
      child = spawn(command, args, { shell: process.platform === 'win32', windowsHide: true });
    } catch (err) {
      resolve({ code: -1, output: err.message });
      return;
    }
    child.stdout?.on('data', (d) => { output += d; });
    child.stderr?.on('data', (d) => { output += d; });
    child.on('error', (err) => resolve({ code: -1, output: output + err.message }));
    child.on('close', (code) => resolve({ code, output }));
  });
}

/** True when `command` is on PATH. */
async function onPath(command) {
  const result = process.platform === 'win32'
    ? await run('where.exe', [command])
    : await run('/bin/sh', ['-c', `command -v ${command}`]);
  return result.code === 0;
}

/** The last lines a failed start printed, without the sign-in link. */
function startFailure(output) {
  return output.split(/\r?\n/).filter((line) => line.trim() && !line.includes('token=')).slice(-15).join('\n');
}

/**
 * Where the manager stands. `ready` and `old` carry its url, token and version;
 * `missing` means no agent-guild command, `no-node` means no npm either.
 */
async function locate() {
  let found = readManager();
  let version = found && await health(found.url);
  if (!version) {
    if (!await onPath('agent-guild')) return { state: await onPath('npm') ? 'missing' : 'no-node' };
    // Starts a manager, or finds one that started meanwhile, and returns once it answers.
    const result = await run('agent-guild', ['--no-browser']);
    found = readManager();
    version = found && await health(found.url);
    if (!version) return { state: 'failed', detail: startFailure(result.output) };
  }
  return { state: newEnough(version) ? 'ready' : 'old', version, ...found };
}

/** The page's address in the tab, opening `view` when that manager's page can. */
function pageSrc({ url, token, version }, view) {
  const hash = new URLSearchParams({ token });
  if (view && newEnough(version, YARD_VERSION)) hash.set('view', view);
  return `${url}/#${hash}`;
}

/** The page's address in the small view, in the tab's last look. */
function compactSrc({ url, token }, look) {
  const hash = new URLSearchParams({ token, layout: 'compact' });
  if (look) {
    hash.set('skin', look.skin);
    hash.set('theme', look.theme);
  }
  return `${url}/#${hash}`;
}

/** The skin and theme a page reported, or null. */
function readLook(value) {
  const skin = value?.skin;
  const theme = value?.theme;
  if (typeof skin !== 'string' || !/^[a-z][a-z0-9-]{0,31}$/.test(skin) || (theme !== 'light' && theme !== 'dark')) return null;
  return { skin, theme };
}

/** A session id from a page, or null. */
function sessionId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : null;
}

/** The absolute http(s) URL `href` names, or null. */
function webUrl(href) {
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

module.exports = {
  MIN_VERSION, YARD_VERSION, VIEW_VERSION, PACKAGE, dataDir, readManager, health, newEnough, locate, startFailure, pageSrc, compactSrc, readLook, sessionId, webUrl,
};
