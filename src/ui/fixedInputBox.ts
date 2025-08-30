import * as readline from 'readline';
import { ThemeManager } from './themeManager';

export class FixedInputBox {
  private spinnerInterval: NodeJS.Timeout | null = null;
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex = 0;
  private isThinking: boolean = false;
  private bottomRow: number = 0;
  
  constructor(private themeManager: ThemeManager) {
    this.bottomRow = process.stdout.rows || 24;
  }

  initialize(): void {
    // Calculate bottom position
    this.bottomRow = process.stdout.rows || 24;
  }

  private moveToBottom(): void {
    // Move cursor to bottom of screen for input
    process.stdout.write(`\x1B[${this.bottomRow};1H`);
  }

  display(): void {
    if (!this.isThinking) {
      this.moveToBottom();
      // Clear the line and show prompt
      process.stdout.write('\x1B[2K'); // Clear entire line
      const prompt = this.themeManager.formatPrompt('💬 > ');
      process.stdout.write(prompt);
    }
  }

  async getInput(): Promise<string> {
    this.moveToBottom();
    
    // Create readline interface with proper prompt
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      prompt: this.themeManager.formatPrompt('💬 > ')
    });

    // Clear line and show prompt
    process.stdout.write('\x1B[2K'); // Clear line
    rl.prompt();

    return new Promise((resolve) => {
      rl.on('line', (input) => {
        rl.close();
        
        // Clear the input line after entering
        this.moveToBottom();
        process.stdout.write('\x1B[2K'); // Clear line
        
        // Move cursor up to show the message in timeline area
        process.stdout.write(`\x1B[${this.bottomRow - 2};1H`);
        
        resolve(input);
      });
    });
  }

  showThinking(): void {
    this.isThinking = true;
    this.spinnerIndex = 0;
    
    this.moveToBottom();
    process.stdout.write('\x1B[2K'); // Clear line
    
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
    }
    
    this.spinnerInterval = setInterval(() => {
      this.moveToBottom();
      const spinner = this.spinnerFrames[this.spinnerIndex];
      const text = this.themeManager.formatInfo(`${spinner} Pensando...`);
      process.stdout.write('\x1B[2K' + text); // Clear and write
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
    }, 100);
  }

  hideThinking(): void {
    this.isThinking = false;
    
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
    
    this.moveToBottom();
    process.stdout.write('\x1B[2K'); // Clear line
  }

  clear(): void {
    this.moveToBottom();
    process.stdout.write('\x1B[2K');
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
    // Recalculate bottom position and display
    this.bottomRow = process.stdout.rows || 24;
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