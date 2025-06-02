"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const pdiManager_1 = require("./pdiManager");
function activate(context) {
    console.log('PDI File Opener extension is now active!');
    const pdiManager = new pdiManager_1.PDIManager();
    // Register the command to open files in PDI
    const disposable = vscode.commands.registerCommand('pdi-file-opener.openInPDI', async (resource) => {
        try {
            if (!resource) {
                vscode.window.showErrorMessage('No file selected');
                return;
            }
            const filePath = resource.fsPath;
            const fileExtension = filePath.toLowerCase().split('.').pop();
            if (!fileExtension || !['kjb', 'ktr'].includes(fileExtension)) {
                vscode.window.showErrorMessage('Please select a .kjb or .ktr file');
                return;
            }
            // Show progress indicator
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Opening file in PDI...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Checking PDI configuration..." });
                await pdiManager.openFileInPDI(filePath, progress);
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to open file in PDI: ${errorMessage}`);
            console.error('PDI File Opener Error:', error);
        }
    });
    context.subscriptions.push(disposable);
    // Register configuration change handler
    const configDisposable = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('pdi-file-opener')) {
            pdiManager.reloadConfiguration();
        }
    });
    context.subscriptions.push(configDisposable);
}
exports.activate = activate;
function deactivate() {
    console.log('PDI File Opener extension is now deactivated');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map