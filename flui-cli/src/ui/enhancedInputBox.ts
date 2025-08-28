import * as readline from 'readline';
import { ThemeManager } from './themeManager';

const readlineLib = readline; // Keep reference for later use

export class EnhancedInputBox {
  private rl: readline.Interface | null = null;
  private currentText: string = '';
  private cursorRow: number = 0;
  private cursorCol: number = 0;
  private lines: string[] = [''];
  private inputHistory: string[] = [];
  private historyIndex: number = -1;
  private isThinking: boolean = false;
  private spinnerInterval: NodeJS.Timeout | null = null;
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex = 0;
  private resolveInput: ((value: string) => void) | null = null;
  private maxWidth: number = process.stdout.columns || 80;
  
  constructor(private themeManager: ThemeManager) {}

  initialize(): void {
    if (this.rl) return;
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      prompt: ''
    });

    // Enable keypress events
    if (process.stdin.setRawMode) {
      readline.emitKeypressEvents(process.stdin, this.rl);
      process.stdin.setRawMode(true);
    }

    // Handle keypress events
    process.stdin.on('keypress', (str, key) => {
      if (!key || this.isThinking) return;

      // Special keys
      if (key.ctrl && key.name === 'c') {
        process.exit(0);
      } else if (key.ctrl && key.name === 'l') {
        this.clearScreen();
      } else if (key.name === 'return') {
        this.handleEnter();
      } else if (key.name === 'backspace') {
        this.handleBackspace();
      } else if (key.name === 'delete') {
        this.handleDelete();
      } else if (key.name === 'left') {
        this.moveCursorLeft();
      } else if (key.name === 'right') {
        this.moveCursorRight();
      } else if (key.name === 'up') {
        this.moveCursorUp();
      } else if (key.name === 'down') {
        this.moveCursorDown();
      } else if (key.name === 'home') {
        this.moveCursorHome();
      } else if (key.name === 'end') {
        this.moveCursorEnd();
      } else if (key.ctrl && key.name === 'a') {
        this.moveCursorHome();
      } else if (key.ctrl && key.name === 'e') {
        this.moveCursorEnd();
      } else if (key.shift && key.name === 'return') {
        // Shift+Enter for new line
        this.insertNewLine();
      } else if (str && !key.ctrl && !key.meta) {
        // Regular character input
        this.insertChar(str);
      }
      
      this.redraw();
    });
  }

  private insertChar(char: string): void {
    const line = this.lines[this.cursorRow];
    this.lines[this.cursorRow] = 
      line.slice(0, this.cursorCol) + char + line.slice(this.cursorCol);
    this.cursorCol++;
    
    // Word wrap if needed
    if (this.lines[this.cursorRow].length > this.maxWidth - 10) {
      this.wrapLine(this.cursorRow);
    }
  }

  private insertNewLine(): void {
    const currentLine = this.lines[this.cursorRow];
    const beforeCursor = currentLine.slice(0, this.cursorCol);
    const afterCursor = currentLine.slice(this.cursorCol);
    
    this.lines[this.cursorRow] = beforeCursor;
    this.lines.splice(this.cursorRow + 1, 0, afterCursor);
    
    this.cursorRow++;
    this.cursorCol = 0;
  }

  private handleBackspace(): void {
    if (this.cursorCol > 0) {
      const line = this.lines[this.cursorRow];
      this.lines[this.cursorRow] = 
        line.slice(0, this.cursorCol - 1) + line.slice(this.cursorCol);
      this.cursorCol--;
    } else if (this.cursorRow > 0) {
      // Join with previous line
      const prevLine = this.lines[this.cursorRow - 1];
      const currentLine = this.lines[this.cursorRow];
      this.cursorCol = prevLine.length;
      this.lines[this.cursorRow - 1] = prevLine + currentLine;
      this.lines.splice(this.cursorRow, 1);
      this.cursorRow--;
    }
  }

  private handleDelete(): void {
    const line = this.lines[this.cursorRow];
    if (this.cursorCol < line.length) {
      this.lines[this.cursorRow] = 
        line.slice(0, this.cursorCol) + line.slice(this.cursorCol + 1);
    } else if (this.cursorRow < this.lines.length - 1) {
      // Join with next line
      this.lines[this.cursorRow] += this.lines[this.cursorRow + 1];
      this.lines.splice(this.cursorRow + 1, 1);
    }
  }

  private handleEnter(): void {
    if (this.resolveInput) {
      const text = this.lines.join('\n').trim();
      if (text) {
        this.inputHistory.push(text);
        this.historyIndex = this.inputHistory.length;
      }
      this.lines = [''];
      this.cursorRow = 0;
      this.cursorCol = 0;
      const resolve = this.resolveInput;
      this.resolveInput = null;
      resolve(text);
    }
  }

  private moveCursorLeft(): void {
    if (this.cursorCol > 0) {
      this.cursorCol--;
    } else if (this.cursorRow > 0) {
      this.cursorRow--;
      this.cursorCol = this.lines[this.cursorRow].length;
    }
  }

  private moveCursorRight(): void {
    const lineLength = this.lines[this.cursorRow].length;
    if (this.cursorCol < lineLength) {
      this.cursorCol++;
    } else if (this.cursorRow < this.lines.length - 1) {
      this.cursorRow++;
      this.cursorCol = 0;
    }
  }

  private moveCursorUp(): void {
    if (this.cursorRow > 0) {
      this.cursorRow--;
      this.cursorCol = Math.min(this.cursorCol, this.lines[this.cursorRow].length);
    } else if (this.historyIndex > 0) {
      // Navigate history
      this.historyIndex--;
      this.loadFromHistory();
    }
  }

  private moveCursorDown(): void {
    if (this.cursorRow < this.lines.length - 1) {
      this.cursorRow++;
      this.cursorCol = Math.min(this.cursorCol, this.lines[this.cursorRow].length);
    } else if (this.historyIndex < this.inputHistory.length - 1) {
      // Navigate history
      this.historyIndex++;
      this.loadFromHistory();
    } else if (this.historyIndex === this.inputHistory.length - 1) {
      // Clear to new input
      this.historyIndex = this.inputHistory.length;
      this.lines = [''];
      this.cursorRow = 0;
      this.cursorCol = 0;
    }
  }

  private moveCursorHome(): void {
    this.cursorCol = 0;
  }

  private moveCursorEnd(): void {
    this.cursorCol = this.lines[this.cursorRow].length;
  }

  private loadFromHistory(): void {
    if (this.historyIndex >= 0 && this.historyIndex < this.inputHistory.length) {
      const text = this.inputHistory[this.historyIndex];
      this.lines = text.split('\n');
      this.cursorRow = this.lines.length - 1;
      this.cursorCol = this.lines[this.cursorRow].length;
    }
  }

  private wrapLine(lineIndex: number): void {
    const line = this.lines[lineIndex];
    if (line.length <= this.maxWidth - 10) return;
    
    // Find last space before max width
    let wrapPoint = this.maxWidth - 10;
    for (let i = wrapPoint; i > 0; i--) {
      if (line[i] === ' ') {
        wrapPoint = i;
        break;
      }
    }
    
    const beforeWrap = line.slice(0, wrapPoint);
    const afterWrap = line.slice(wrapPoint).trim();
    
    this.lines[lineIndex] = beforeWrap;
    if (lineIndex < this.lines.length - 1) {
      this.lines[lineIndex + 1] = afterWrap + ' ' + this.lines[lineIndex + 1];
    } else {
      this.lines.push(afterWrap);
    }
    
    // Adjust cursor if needed
    if (this.cursorRow === lineIndex && this.cursorCol > wrapPoint) {
      this.cursorRow++;
      this.cursorCol = this.cursorCol - wrapPoint;
    }
  }

  private redraw(): void {
    if (!this.rl || this.isThinking) return;
    
    // Move cursor to bottom of screen
    const rows = process.stdout.rows || 24;
    process.stdout.write(`\x1B[${rows};1H`); // Move to bottom row
    
    // Clear from cursor to end of screen
    process.stdout.write('\x1B[J');
    
    // Draw border
    const border = this.themeManager.formatBorder('━'.repeat(this.maxWidth));
    process.stdout.write(border + '\n');
    
    // Draw input with prompt
    const prompt = this.themeManager.formatPrompt('💬 > ');
    const text = this.lines.join(' ');
    process.stdout.write(prompt + text);
    
    // Position cursor correctly
    const promptLength = 5; // "💬 > " is 5 chars
    const targetCol = promptLength + this.cursorCol + 1;
    process.stdout.write(`\x1B[${rows + 1};${targetCol}H`);
  }

  display(): void {
    // Simple display for now
    const border = this.themeManager.formatBorder('━'.repeat(this.maxWidth));
    process.stdout.write('\n' + border + '\n');
    const prompt = this.themeManager.formatPrompt('💬 > ');
    process.stdout.write(prompt);
  }

  async getInput(): Promise<string> {
    // Fallback to simple readline for now to ensure it works
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    
    return new Promise((resolve) => {
      rl.question('', (answer) => {
        rl.close();
        if (answer.trim()) {
          this.inputHistory.push(answer);
          this.historyIndex = this.inputHistory.length;
        }
        resolve(answer);
      });
    });
  }

  showThinking(): void {
    this.isThinking = true;
    this.spinnerIndex = 0;
    
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
    }
    
    this.spinnerInterval = setInterval(() => {
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
      this.drawSpinner();
    }, 100);
  }

  hideThinking(): void {
    this.isThinking = false;
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
    this.redraw();
  }

  private drawSpinner(): void {
    process.stdout.write('\x1B[2K\r'); // Clear line and return
    const spinner = this.spinnerFrames[this.spinnerIndex];
    const text = this.themeManager.formatInfo(`${spinner} Pensando...`);
    process.stdout.write(text);
  }

  clearScreen(): void {
    process.stdout.write('\x1Bc');
    process.stdout.write('\x1B[H');
    if (this.onClearScreen) {
      this.onClearScreen();
    }
    this.redraw();
  }

  clear(): void {
    this.lines = [''];
    this.cursorRow = 0;
    this.cursorCol = 0;
    this.redraw();
  }

  pause(): void {
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(false);
    }
  }

  resume(): void {
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
    }
    this.redraw();
  }

  destroy(): void {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
    }
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  onClearScreen?: () => void;
}