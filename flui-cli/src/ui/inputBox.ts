import * as readline from 'readline';
import { ThemeManager } from './themeManager';

interface ExtendedReadline extends readline.Interface {
  clearLine?(dir: number): void;
  moveCursor?(dx: number, dy: number): void;
  output?: NodeJS.WriteStream & {
    clearLine(dir: number): void;
    moveCursor(dx: number, dy: number): void;
  };
}

export class InputBox {
  private rl: ExtendedReadline | null = null;
  private isThinking: boolean = false;
  private spinnerInterval: NodeJS.Timeout | null = null;
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex = 0;
  private currentInput: string = '';
  private cursorPosition: number = 0;
  private inputHistory: string[] = [];
  private historyIndex: number = -1;

  constructor(private themeManager: ThemeManager) {}

  initialize(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    }) as ExtendedReadline;

    // Set up key bindings
    this.rl.on('line', (input) => {
      this.currentInput = input;
      this.inputHistory.push(input);
      this.historyIndex = this.inputHistory.length;
    });

    this.rl.on('keypress', (char, key) => {
      if (!key) return;
      
      // Handle Ctrl+L to clear screen
      if (key.ctrl && key.name === 'l') {
        this.clearScreen();
        return;
      }
      
      switch (key.name) {
        case 'up':
          if (this.historyIndex > 0) {
            this.historyIndex--;
            this.currentInput = this.inputHistory[this.historyIndex] || '';
            this.updateDisplay();
          }
          break;
        case 'down':
          if (this.historyIndex < this.inputHistory.length - 1) {
            this.historyIndex++;
            this.currentInput = this.inputHistory[this.historyIndex] || '';
            this.updateDisplay();
          }
          break;
        case 'left':
          if (this.cursorPosition > 0) {
            this.cursorPosition--;
            if (this.rl?.output?.moveCursor) {
              this.rl.output.moveCursor(-1, 0);
            }
          }
          break;
        case 'right':
          if (this.cursorPosition < this.currentInput.length) {
            this.cursorPosition++;
            if (this.rl?.output?.moveCursor) {
              this.rl.output.moveCursor(1, 0);
            }
          }
          break;
      }
    });
  }

  private updateDisplay(): void {
    if (!this.rl) return;
    
    // Clear current line
    if (this.rl.output?.clearLine) {
      this.rl.output.clearLine(0);
      this.rl.output.moveCursor(-1000, 0);
    }
    
    // Write updated input
    this.rl.write(this.currentInput);
    this.cursorPosition = this.currentInput.length;
  }

  display(): void {
    const border = this.themeManager.formatBorder('━'.repeat(process.stdout.columns || 80));
    
    // Move cursor to bottom of screen
    process.stdout.write('\x1B[999B'); // Move down
    process.stdout.write('\x1B[0G');   // Move to start of line
    
    // Draw border
    process.stdout.write(border + '\n');
    
    // Draw input prompt
    const prompt = this.themeManager.formatPrimary('💬 > ');
    process.stdout.write(prompt);
  }

  async getUserInput(): Promise<string> {
    if (!this.rl) {
      this.initialize();
    }

    this.display();
    
    return new Promise((resolve) => {
      if (!this.rl) return resolve('');
      
      const handler = (input: string) => {
        this.currentInput = '';
        this.cursorPosition = 0;
        resolve(input.trim());
      };
      
      this.rl.once('line', handler);
    });
  }

  startInput(): void {
    if (!this.rl) {
      this.initialize();
    }
    
    this.display();
    this.rl?.resume();
  }

  showThinking(): void {
    this.isThinking = true;
    
    if (!this.rl) return;
    
    // Clear input area
    if (this.rl.output?.clearLine) {
      this.rl.output.clearLine(0);
      this.rl.output.moveCursor(-1000, 0);
    }
    
    // Start spinner animation
    this.spinnerInterval = setInterval(() => {
      if (!this.rl || !this.rl.output) return;
      
      if (this.rl.output.clearLine) {
        this.rl.output.clearLine(0);
        this.rl.output.moveCursor(-1000, 0);
      }
      
      const spinner = this.spinnerFrames[this.spinnerIndex];
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
      
      const message = this.themeManager.formatInfo(`${spinner} Pensando...`);
      process.stdout.write(message);
    }, 80);
    
    // Show initial frame
    const spinner = this.spinnerFrames[0];
    const message = this.themeManager.formatInfo(`${spinner} Pensando...`);
    process.stdout.write(message);
  }

  hideThinking(): void {
    this.isThinking = false;
    
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
    
    if (!this.rl) return;
    
    // Clear spinner
    if (this.rl.output?.clearLine) {
      this.rl.output.clearLine(0);
      this.rl.output.moveCursor(-1000, 0);
    }
    
    // Restore input box
    this.display();
  }

  clear(): void {
    if (!this.rl) return;
    
    if (this.rl.output?.clearLine) {
      this.rl.output.clearLine(0);
    }
    this.rl.write('');
    this.currentInput = '';
    this.cursorPosition = 0;
  }

  resetCursor(): void {
    if (!this.rl) return;
    
    if (this.rl.output?.moveCursor) {
      this.rl.output.moveCursor(-1000, 0);
    }
    this.cursorPosition = 0;
  }

  clearScreen(): void {
    // Clear screen but keep input box
    process.stdout.write('\x1Bc'); // Clear screen
    process.stdout.write('\x1B[H'); // Move cursor to home
    
    // Trigger timeline clear event
    if (this.onClearScreen) {
      this.onClearScreen();
    }
    
    // Redisplay input box
    this.display();
  }

  onClearScreen?: () => void;

  destroy(): void {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
    
    if (this.rl) {
      if (this.rl.output?.clearLine) {
        this.rl.output.clearLine(0);
      }
      this.rl.close();
      this.rl = null;
    }
  }
}