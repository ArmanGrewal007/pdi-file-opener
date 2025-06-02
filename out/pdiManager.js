"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDIManager = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class PDIManager {
    constructor() {
        this.pdiPath = '';
        this.debugMode = false;
        this.loadConfiguration();
    }
    reloadConfiguration() {
        this.loadConfiguration();
    }
    loadConfiguration() {
        const config = vscode.workspace.getConfiguration('pdi-file-opener');
        this.pdiPath = config.get('pdiPath', '');
        this.debugMode = config.get('enableDebugLogs', false);
        this.log('Configuration loaded:', { pdiPath: this.pdiPath, debugMode: this.debugMode });
    }
    async openFileInPDI(filePath, progress) {
        this.log('Opening file in PDI:', filePath);
        // Validate PDI path
        if (!this.pdiPath) {
            throw new Error('PDI path not configured. Please set the PDI installation path in settings.');
        }
        if (!fs.existsSync(this.pdiPath)) {
            throw new Error(`PDI path not found: ${this.pdiPath}`);
        }
        const spoonPath = path.join(this.pdiPath, 'spoon.sh');
        if (!fs.existsSync(spoonPath)) {
            throw new Error(`Spoon script not found at: ${spoonPath}`);
        }
        progress?.report({ increment: 25, message: "Checking if PDI is already running..." });
        // Check if Spoon is already running
        const isRunning = await this.isSpoonRunning();
        if (!isRunning) {
            progress?.report({ increment: 50, message: "Starting PDI..." });
            await this.startSpoon();
            // Wait for Spoon to fully load
            progress?.report({ increment: 75, message: "Waiting for PDI to load..." });
            await this.waitForSpoonToStart();
        }
        else {
            progress?.report({ increment: 50, message: "PDI is already running..." });
            await this.focusSpoon();
        }
        progress?.report({ increment: 90, message: "Opening file..." });
        // Open the file using AppleScript
        await this.openFileViaAppleScript(filePath);
        progress?.report({ increment: 100, message: "File opened successfully!" });
    }
    async isSpoonRunning() {
        try {
            const { stdout } = await execAsync('ps aux | grep -i spoon | grep -v grep');
            const isRunning = stdout.trim().length > 0;
            this.log('Spoon running check:', isRunning);
            return isRunning;
        }
        catch (error) {
            this.log('Error checking if Spoon is running:', error);
            return false;
        }
    }
    async startSpoon() {
        this.log('Starting Spoon...');
        const spoonPath = path.join(this.pdiPath, 'spoon.sh');
        const command = `env /usr/bin/arch -x86_64 /bin/zsh --login -c "cd '${this.pdiPath}' && ./spoon.sh"`;
        this.log('Executing command:', command);
        // Start Spoon in background
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                this.log('Error starting Spoon:', error);
            }
            if (stdout)
                this.log('Spoon stdout:', stdout);
            if (stderr)
                this.log('Spoon stderr:', stderr);
        });
    }
    async waitForSpoonToStart() {
        this.log('Waiting for Spoon to start...');
        const maxAttempts = 30; // 30 seconds timeout
        let attempts = 0;
        while (attempts < maxAttempts) {
            if (await this.isSpoonRunning()) {
                // Additional wait for GUI to be ready
                await this.sleep(3000);
                this.log('Spoon is ready!');
                return;
            }
            await this.sleep(1000);
            attempts++;
        }
        throw new Error('Timeout waiting for Spoon to start');
    }
    async focusSpoon() {
        this.log('Focusing Spoon window...');
        const script = `
            tell application "System Events"
                set spoonProcess to first process whose name contains "java" or name contains "Spoon"
                if spoonProcess exists then
                    set frontmost of spoonProcess to true
                end if
            end tell
        `;
        await this.executeAppleScript(script);
    }
    async openFileViaAppleScript(filePath) {
        this.log('Opening file via AppleScript:', filePath);
        // Escape the file path for AppleScript
        const escapedPath = filePath.replace(/'/g, "\\'");
        await vscode.env.clipboard.writeText(filePath);
        const script = `
            tell application "System Events"
                -- Find Spoon process (it might be named "java" or "Spoon")
                set spoonProcess to null
                try
                    set spoonProcess to first process whose name contains "java"
                    set frontmost of spoonProcess to true
                on error
                    try
                        set spoonProcess to first process whose name contains "Spoon"
                        set frontmost of spoonProcess to true
                    on error
                        error "Could not find Spoon process"
                    end try
                end try
                
                -- Wait a moment for window to be active
                delay 2
                
                -- Open file dialog using Cmd+O
                keystroke "o" using command down
                delay 2
                
                -- Use Cmd+Shift+G to open "Go to Folder" dialog
                keystroke "g" using {command down, shift down}
                delay 2
                
                -- Backspace to clear any existing text and Type the complete file path and press enter
                -- keystroke (ASCII character 8)
                -- delay 4
                keystroke "v" using command down
                delay 0.5
                keystroke return
                delay 0.5
                keystroke return
                
            end tell
        `;
        try {
            await this.executeAppleScript(script);
            this.log('File opened successfully via AppleScript');
        }
        catch (error) {
            this.log('AppleScript failed, trying fallback method...');
            await this.fallbackFileOpen(filePath);
        }
    }
    async fallbackFileOpen(filePath) {
        this.log('Using fallback method: highlighting file in Finder');
        // Show file in Finder as fallback
        await execAsync(`open -R "${filePath}"`);
        // Show instruction to user
        const result = await vscode.window.showInformationMessage('File has been highlighted in Finder. Please use Cmd+O in PDI to open it manually.', 'Got it', 'Copy Path');
        if (result === 'Copy Path') {
            await vscode.env.clipboard.writeText(filePath);
            vscode.window.showInformationMessage('File path copied to clipboard');
        }
    }
    async executeAppleScript(script) {
        this.log('Executing AppleScript...');
        try {
            const { stdout } = await execAsync(`osascript -e '${script}'`);
            return stdout.trim();
        }
        catch (error) {
            this.log('AppleScript execution failed:', error);
            throw error;
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    log(message, data) {
        if (this.debugMode) {
            console.log(`[PDI File Opener] ${message}`, data || '');
        }
    }
}
exports.PDIManager = PDIManager;
//# sourceMappingURL=pdiManager.js.map