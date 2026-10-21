// Agent Guild in an editor tab, and its Yard in a small view. The session manager owns the sessions; closing either or VS Code leaves them running.

const vscode = require('vscode');
const { Panel, VIEW_TYPE } = require('./panel');
const { YardView, VIEW_ID } = require('./yard');

function activate(context) {
  const events = {
    ready: new vscode.EventEmitter(),
    viewReady: new vscode.EventEmitter(),
    look: new vscode.EventEmitter(),
    connected: new vscode.EventEmitter(),
  };
  const open = () => Panel.open(events);
  const openYard = () => Panel.open(events, 'yard');
  const yard = new YardView(context.globalState, events);

  const button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  button.text = '$(organization) Agent Guild';
  button.tooltip = 'Open Agent Guild';
  button.command = 'agentGuild.open';
  button.show();

  context.subscriptions.push(
    ...Object.values(events),
    button,
    vscode.commands.registerCommand('agentGuild.open', open),
    vscode.commands.registerCommand('agentGuild.openYard', openYard),
    vscode.window.registerWebviewPanelSerializer(VIEW_TYPE, {
      deserializeWebviewPanel: async (panel) => Panel.revive(panel, events),
    }),
    vscode.window.registerWebviewViewProvider(VIEW_ID, yard),
  );
  // For the extension's own tests: open the tab and the view, and hear when their pages reached the manager.
  return { open, openYard, yard, onReady: events.ready.event, onViewReady: events.viewReady.event };
}

module.exports = { activate, deactivate() {} };
