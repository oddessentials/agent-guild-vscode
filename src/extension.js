// Agent Guild in an editor tab. The session manager owns the sessions; closing the tab or VS Code leaves them running.

const vscode = require('vscode');
const { Panel, VIEW_TYPE } = require('./panel');

function activate(context) {
  const ready = new vscode.EventEmitter();
  const open = () => Panel.open(ready);
  const openYard = () => Panel.open(ready, 'yard');

  const button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  button.text = '$(organization) Agent Guild';
  button.tooltip = 'Open Agent Guild';
  button.command = 'agentGuild.open';
  button.show();

  context.subscriptions.push(
    ready,
    button,
    vscode.commands.registerCommand('agentGuild.open', open),
    vscode.commands.registerCommand('agentGuild.openYard', openYard),
    vscode.window.registerWebviewPanelSerializer(VIEW_TYPE, {
      deserializeWebviewPanel: async (panel) => Panel.revive(panel, ready),
    }),
  );
  // For the extension's own tests: open the tab and hear when the page reached its manager.
  return { open, openYard, onReady: ready.event };
}

module.exports = { activate, deactivate() {} };
