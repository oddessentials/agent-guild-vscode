const vscode = require('vscode');

const READY_WITHIN_MS = 60000;

exports.run = async () => {
  const api = await vscode.extensions.getExtension('OddEssentials.agent-guild').activate();
  const version = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`The page did not report ready within ${READY_WITHIN_MS / 1000} s.`)), READY_WITHIN_MS);
    const heard = api.onReady((v) => {
      clearTimeout(timer);
      heard.dispose();
      resolve(v);
    });
    api.open();
  });
  console.log(`Agent Guild ${version} opened in an editor tab and reached its manager.`);
};
