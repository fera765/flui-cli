import * as readline from 'readline';
import { ThemeManager } from './themeManager';

export class BasicInputBox {
  private spinnerInterval: NodeJS.Timeout | null = null;
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex = 0;
  private isThinking: boolean = false;
  
  constructor(private themeManager: ThemeManager) {}

  initialize(): void {
    // Nothing to initialize
  }

  display(): void {
    // Show prompt only if not thinking
    if (!this.isThinking) {
      const prompt = this.themeManager.formatPrompt('💬 > ');
      process.stdout.write(prompt);
    }
  }

  async getInput(): Promise<string> {
    // Use readline with a custom prompt that we control
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      prompt: this.themeManager.formatPrompt('💬 > ')
    });

    // Show the prompt
    rl.prompt();

    return new Promise((resolve) => {
      rl.on('line', (input) => {
        rl.close();
        resolve(input);
      });
    });
  }

  showThinking(): void {
    this.isThinking = true;
    this.spinnerIndex = 0;
    
    // Clear line and show spinner
    process.stdout.write('\r\x1B[K'); // Clear line
    
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
    }
    
    this.spinnerInterval = setInterval(() => {
      const spinner = this.spinnerFrames[this.spinnerIndex];
      const text = this.themeManager.formatInfo(`${spinner} Pensando...`);
      process.stdout.write('\r\x1B[K' + text); // Clear and write
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
    }, 100);
  }

  hideThinking(): void {
    this.isThinking = false;
    
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
    
    // Clear spinner line
    process.stdout.write('\r\x1B[K');
  }

  clear(): void {
    process.stdout.write('\r\x1B[K');
  }

  clearScreen(): void {
    process.stdout.write('\x1Bc\x1B[H');
    if (this.onClearScreen) {
      this.onClearScreen();
    }
  }

  pause(): void {
    // Nothing to pause
  }

  resume(): void {
    // Nothing to resume
    this.display();
  }

  destroy(): void {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
  }

  onClearScreen?: () => void;
}