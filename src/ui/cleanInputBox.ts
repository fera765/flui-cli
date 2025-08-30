import * as readline from 'readline';
import { ThemeManager } from './themeManager';

export class CleanInputBox {
  private isThinking: boolean = false;
  private spinnerInterval: NodeJS.Timeout | null = null;
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex = 0;
  
  constructor(private themeManager: ThemeManager) {}

  initialize(): void {
    // Nothing to initialize
  }

  display(): void {
    // Don't display prompt here, let readline handle it
  }

  async getInput(): Promise<string> {
    // Use readline with terminal mode to handle arrow keys properly
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      prompt: this.themeManager.formatPrompt('💬 > ')
    });

    // Show prompt using readline's prompt method
    rl.prompt();

    return new Promise((resolve) => {
      rl.once('line', (input) => {
        rl.close();
        resolve(input);
      });
    });
  }

  showThinking(): void {
    this.isThinking = true;
    this.spinnerIndex = 0;
    
    // Show spinner on a new line
    process.stdout.write('\n');
    
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
    }
    
    this.spinnerInterval = setInterval(() => {
      const spinner = this.spinnerFrames[this.spinnerIndex];
      const text = this.themeManager.formatInfo(`\r${spinner} Pensando...`);
      process.stdout.write(text);
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
    }, 100);
  }

  hideThinking(): void {
    this.isThinking = false;
    
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
    
    // Clear spinner line and move up
    process.stdout.write('\r\x1B[K'); // Clear line
    process.stdout.write('\x1B[1A'); // Move up one line
    process.stdout.write('\x1B[K'); // Clear that line too
  }

  clear(): void {
    // Nothing to clear
  }

  clearScreen(): void {
    process.stdout.write('\x1Bc\x1B[3J\x1B[H');
    if (this.onClearScreen) {
      this.onClearScreen();
    }
  }

  pause(): void {
    // Nothing to pause
  }

  resume(): void {
    // Nothing to resume
  }

  destroy(): void {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
  }

  onClearScreen?: () => void;
}