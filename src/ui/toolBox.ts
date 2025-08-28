import chalk from 'chalk';
import { ThemeManager } from './themeManager';
import { ToolExecutionResult, ToolStatus } from '../services/toolsManager';

export class ToolBox {
  private themeManager: ThemeManager;
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentSpinnerIndex = 0;
  private spinnerInterval?: NodeJS.Timeout;

  constructor(themeManager: ThemeManager) {
    this.themeManager = themeManager;
  }

  render(result: ToolExecutionResult, status: ToolStatus): string {
    const lines: string[] = [];
    
    // Render status line
    const statusLine = this.renderStatus(
      result.toolName,
      status,
      this.getOperationDescription(result)
    );
    lines.push(statusLine);

    // Render log box if logs are available
    if (result.displayLogs) {
      const logBox = this.renderLogBox(result.displayLogs);
      lines.push(logBox);
    }

    return lines.join('\n');
  }

  renderStatus(toolName: string, status: ToolStatus, operation: string): string {
    const theme = this.themeManager.getCurrentTheme();
    const formattedName = this.formatToolName(toolName);
    
    let statusIcon: string;
    let statusColor: chalk.Chalk;
    
    switch (status) {
      case 'running':
        statusIcon = this.getCurrentSpinnerFrame();
        statusColor = chalk.hex(theme.colors.info);
        break;
      case 'success':
        statusIcon = '✅';
        statusColor = chalk.hex(theme.colors.primary);
        break;
      case 'error':
        statusIcon = '❌';
        statusColor = chalk.hex(theme.colors.error);
        break;
      default:
        statusIcon = '⭕';
        statusColor = chalk.hex(theme.colors.secondary);
    }

    const nameColor = chalk.hex(theme.colors.primary);
    const operationColor = chalk.hex(theme.colors.secondary);
    
    return `${statusIcon} ${nameColor(formattedName)} - ${operationColor(operation)}`;
  }

  renderLogBox(logs: string): string {
    const theme = this.themeManager.getCurrentTheme();
    const borderColor = chalk.hex(theme.colors.border);
    const logColor = chalk.hex(theme.colors.assistantMessage);
    
    const lines = logs.split('\n');
    const maxWidth = Math.max(...lines.map(l => l.length), 40);
    
    const box: string[] = [];
    
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

  formatToolName(toolName: string): string {
    return toolName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getOperationDescription(result: ToolExecutionResult): string {
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

  getExecutionSummary(result: ToolExecutionResult): string {
    const parts: string[] = [];
    
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
  getSpinnerFrames(): string[] {
    return [...this.spinnerFrames];
  }

  getCurrentSpinnerFrame(): string {
    return this.spinnerFrames[this.currentSpinnerIndex];
  }

  advanceSpinner(): void {
    this.currentSpinnerIndex = (this.currentSpinnerIndex + 1) % this.spinnerFrames.length;
  }

  startSpinnerAnimation(callback: () => void): void {
    this.stopSpinnerAnimation();
    this.spinnerInterval = setInterval(() => {
      this.advanceSpinner();
      callback();
    }, 80);
  }

  stopSpinnerAnimation(): void {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = undefined;
    }
    this.currentSpinnerIndex = 0;
  }

  // Create a live updating display for running tools
  createLiveDisplay(toolName: string, operation: string): {
    update: (status: ToolStatus, logs?: string) => string;
    stop: () => void;
  } {
    let currentStatus: ToolStatus = 'running';
    let currentLogs = '';
    
    this.startSpinnerAnimation(() => {
      // Spinner animation callback
    });

    return {
      update: (status: ToolStatus, logs?: string) => {
        currentStatus = status;
        if (logs) currentLogs = logs;
        
        const lines: string[] = [];
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