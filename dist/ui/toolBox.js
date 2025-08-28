"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolBox = void 0;
const chalk_1 = __importDefault(require("chalk"));
class ToolBox {
    constructor(themeManager) {
        this.spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.currentSpinnerIndex = 0;
        this.themeManager = themeManager;
    }
    render(result, status) {
        const lines = [];
        // Render status line
        const statusLine = this.renderStatus(result.toolName, status, this.getOperationDescription(result));
        lines.push(statusLine);
        // Render log box if logs are available
        if (result.displayLogs) {
            const logBox = this.renderLogBox(result.displayLogs);
            lines.push(logBox);
        }
        return lines.join('\n');
    }
    renderStatus(toolName, status, operation) {
        const theme = this.themeManager.getCurrentTheme();
        const formattedName = this.formatToolName(toolName);
        let statusIcon;
        let statusColor;
        switch (status) {
            case 'running':
                statusIcon = this.getCurrentSpinnerFrame();
                statusColor = chalk_1.default.hex(theme.colors.info);
                break;
            case 'success':
                statusIcon = '✅';
                statusColor = chalk_1.default.hex(theme.colors.primary);
                break;
            case 'error':
                statusIcon = '❌';
                statusColor = chalk_1.default.hex(theme.colors.error);
                break;
            default:
                statusIcon = '⭕';
                statusColor = chalk_1.default.hex(theme.colors.secondary);
        }
        const nameColor = chalk_1.default.hex(theme.colors.primary);
        const operationColor = chalk_1.default.hex(theme.colors.secondary);
        return `${statusIcon} ${nameColor(formattedName)} - ${operationColor(operation)}`;
    }
    renderLogBox(logs) {
        const theme = this.themeManager.getCurrentTheme();
        const borderColor = chalk_1.default.hex(theme.colors.border);
        const logColor = chalk_1.default.hex(theme.colors.assistantMessage);
        const lines = logs.split('\n');
        const maxWidth = Math.max(...lines.map(l => l.length), 40);
        const box = [];
        // Top border
        box.push(borderColor('┌' + '─'.repeat(maxWidth + 2) + '┐'));
        // Log lines
        for (const line of lines) {
            const paddedLine = line.padEnd(maxWidth);
            box.push(borderColor('│ ') + logColor(paddedLine) + borderColor(' │'));
        }
        // Bottom border
        box.push(borderColor('└' + '─'.repeat(maxWidth + 2) + '┘'));
        return box.join('\n');
    }
    formatToolName(toolName) {
        return toolName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    getOperationDescription(result) {
        // Extract operation details from metadata or result
        if (result.metadata?.command) {
            return result.metadata.command;
        }
        if (result.toolName === 'agent' && result.metadata?.messages) {
            const messages = result.metadata.messages;
            if (Array.isArray(messages) && messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                const preview = lastMessage.content.substring(0, 50);
                return preview + (lastMessage.content.length > 50 ? '...' : '');
            }
        }
        if (result.output && typeof result.output === 'string') {
            const preview = result.output.substring(0, 50);
            return preview + (result.output.length > 50 ? '...' : '');
        }
        return 'Processing...';
    }
    getExecutionSummary(result) {
        const parts = [];
        if (result.duration) {
            const seconds = (result.duration / 1000).toFixed(2);
            parts.push(`${seconds}s`);
        }
        if (result.metadata?.command) {
            parts.push(result.metadata.command);
        }
        return parts.join(' - ');
    }
    // Spinner management
    getSpinnerFrames() {
        return [...this.spinnerFrames];
    }
    getCurrentSpinnerFrame() {
        return this.spinnerFrames[this.currentSpinnerIndex];
    }
    advanceSpinner() {
        this.currentSpinnerIndex = (this.currentSpinnerIndex + 1) % this.spinnerFrames.length;
    }
    startSpinnerAnimation(callback) {
        this.stopSpinnerAnimation();
        this.spinnerInterval = setInterval(() => {
            this.advanceSpinner();
            callback();
        }, 80);
    }
    stopSpinnerAnimation() {
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = undefined;
        }
        this.currentSpinnerIndex = 0;
    }
    // Create a live updating display for running tools
    createLiveDisplay(toolName, operation) {
        let currentStatus = 'running';
        let currentLogs = '';
        this.startSpinnerAnimation(() => {
            // Spinner animation callback
        });
        return {
            update: (status, logs) => {
                currentStatus = status;
                if (logs)
                    currentLogs = logs;
                const lines = [];
                lines.push(this.renderStatus(toolName, currentStatus, operation));
                if (currentLogs) {
                    lines.push(this.renderLogBox(currentLogs));
                }
                return lines.join('\n');
            },
            stop: () => {
                this.stopSpinnerAnimation();
            }
        };
    }
}
exports.ToolBox = ToolBox;
//# sourceMappingURL=toolBox.js.map