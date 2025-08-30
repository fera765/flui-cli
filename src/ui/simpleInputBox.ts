import * as readline from 'readline';
import { ThemeManager } from './themeManager';

export class SimpleInputBox {
  private rl: readline.Interface | null = null;
  private isThinking: boolean = false;
  private spinnerInterval: NodeJS.Timeout | null = null;
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex = 0;
  private inputHistory: string[] = [];
  private historyIndex: number = -1;
  private isWaitingForInput: boolean = false;
  
  constructor(private themeManager: ThemeManager) {}

  initialize(): void {
    // Setup is done when needed
  }

  display(): void {
    if (!this.isThinking && !this.isWaitingForInput) {
      const prompt = this.themeManager.formatPrompt('💬 > ');
      process.stdout.write(prompt);
    }
  }

  async getInput(): Promise<string> {
    if (this.isWaitingForInput) {
      return ''; // Prevent multiple simultaneous inputs
    }

    this.isWaitingForInput = true;

    // Create a fresh readline interface for each input
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      prompt: ''
    });

    return new Promise((resolve) => {
      if (!this.rl) {
        this.isWaitingForInput = false;
        resolve('');
        return;
      }

      // Handle line input
      this.rl.once('line', (input) => {
        if (this.rl) {
          this.rl.close();
          this.rl = null;
        }
        
        this.isWaitingForInput = false;
        
        // Save to history if not empty
        const trimmed = input.trim();
        if (trimmed && trimmed !== '/exit') {
          this.inputHistory.push(trimmed);
          this.historyIndex = this.inputHistory.length;
        }
        
        resolve(input);
      });

      // Handle history navigation with arrow keys
      if (process.stdin.isTTY) {
        readline.emitKeypressEvents(process.stdin, this.rl);
        
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(true);
        }

        const keypressHandler = (str: string, key: any) => {
          if (!key || !this.rl) return;

          if (key.name === 'up') {
            // Navigate history up
            if (this.historyIndex > 0) {
              this.historyIndex--;
              const historicInput = this.inputHistory[this.historyIndex];
              
              // Clear current line and write historic input
              if (this.rl.line) {
                process.stdout.write('\r' + ' '.repeat(this.rl.line.length + 10) + '\r');
              }
              process.stdout.write(this.themeManager.formatPrompt('💬 > ') + historicInput);
              (this.rl as any).line = historicInput;
              (this.rl as any).cursor = historicInput.length;
            }
          } else if (key.name === 'down') {
            // Navigate history down
            if (this.historyIndex < this.inputHistory.length - 1) {
              this.historyIndex++;
              const historicInput = this.inputHistory[this.historyIndex];
              
              // Clear current line and write historic input
              if (this.rl.line) {
                process.stdout.write('\r' + ' '.repeat(this.rl.line.length + 10) + '\r');
              }
              process.stdout.write(this.themeManager.formatPrompt('💬 > ') + historicInput);
              (this.rl as any).line = historicInput;
              (this.rl as any).cursor = historicInput.length;
            } else if (this.historyIndex === this.inputHistory.length - 1) {
              // Clear input when at the end of history
              this.historyIndex = this.inputHistory.length;
              if (this.rl.line) {
                process.stdout.write('\r' + ' '.repeat(this.rl.line.length + 10) + '\r');
              }
              process.stdout.write(this.themeManager.formatPrompt('💬 > '));
              (this.rl as any).line = '';
              (this.rl as any).cursor = 0;
            }
          }
        };

        process.stdin.on('keypress', keypressHandler);

        // Cleanup on close
        this.rl.once('close', () => {
          process.stdin.removeListener('keypress', keypressHandler);
          if (process.stdin.setRawMode && process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
        });
      }
    });
  }

  showThinking(): void {
    this.isThinking = true;
    this.spinnerIndex = 0;
    
    // Clear current line
    process.stdout.write('\r' + ' '.repeat(50) + '\r');
    
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
    }
    
    this.spinnerInterval = setInterval(() => {
      if (this.isThinking) {
        this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
        const spinner = this.spinnerFrames[this.spinnerIndex];
        const text = this.themeManager.formatInfo(`${spinner} Pensando...`);
        process.stdout.write('\r' + text);
      }
    }, 100);
  }

  hideThinking(): void {
    this.isThinking = false;
    
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
    
    // Clear the spinner line
    process.stdout.write('\r' + ' '.repeat(50) + '\r');
  }

  clearScreen(): void {
    process.stdout.write('\x1Bc');
    process.stdout.write('\x1B[H');
    if (this.onClearScreen) {
      this.onClearScreen();
    }
  }

  clear(): void {
    // Just clear the current line
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
  }

  pause(): void {
    if (this.rl) {
      this.rl.pause();
    }
  }

  resume(): void {
    if (this.rl) {
      this.rl.resume();
    }
  }

  destroy(): void {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
    
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    
    this.isWaitingForInput = false;
  }

  onClearScreen?: () => void;
}