import * as readline from 'readline';
import { ThemeManager } from './themeManager';

export interface SelectorOption {
  label: string;
  value: any;
  description?: string;
}

export class InteractiveSelector {
  private rl: readline.Interface | null = null;
  
  constructor(private themeManager: ThemeManager) {}

  async select(
    title: string,
    options: SelectorOption[],
    currentValue?: any
  ): Promise<any | null> {
    return new Promise((resolve) => {
      let selectedIndex = 0;
      
      // Find current value index
      if (currentValue !== undefined) {
        const index = options.findIndex(opt => opt.value === currentValue);
        if (index >= 0) selectedIndex = index;
      }

      // Store original stdin state
      const wasRaw = process.stdin.isRaw;
      
      // Create a temporary readline interface
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
      });

      // Function to render the menu
      const render = () => {
        // Clear screen for menu area
        console.log('\x1B[2J\x1B[H'); // Clear screen and move to top
        
        // Display title
        console.log(this.themeManager.formatPrimary(`\n${title}\n`));
        console.log(this.themeManager.formatDim('Use ↑/↓ arrows to navigate, Enter to select, ESC to cancel\n'));
        
        // Display options
        options.forEach((option, index) => {
          const isSelected = index === selectedIndex;
          const prefix = isSelected ? '▶ ' : '  ';
          const isCurrent = option.value === currentValue;
          const suffix = isCurrent ? ' (current)' : '';
          
          if (isSelected) {
            console.log(this.themeManager.formatHighlight(prefix + option.label + suffix));
            if (option.description) {
              console.log(this.themeManager.formatDim('    ' + option.description));
            }
          } else {
            console.log(this.themeManager.formatSecondary(prefix + option.label + suffix));
            if (option.description) {
              console.log(this.themeManager.formatDim('    ' + option.description));
            }
          }
        });
      };

      // Initial render
      render();

      // Set up raw mode for arrow key handling
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
      }
      process.stdin.resume();

      // Handle keypress
      const onKeypress = (chunk: Buffer) => {
        const key = chunk.toString();
        
        if (key === '\x1B[A') { // Up arrow
          selectedIndex = Math.max(0, selectedIndex - 1);
          render();
        } else if (key === '\x1B[B') { // Down arrow
          selectedIndex = Math.min(options.length - 1, selectedIndex + 1);
          render();
        } else if (key === '\r' || key === '\n') { // Enter
          cleanup();
          resolve(options[selectedIndex].value);
        } else if (key === '\x1B' || key === '\x03') { // ESC or Ctrl+C
          cleanup();
          resolve(null);
        }
      };

      // Cleanup function
      const cleanup = () => {
        process.stdin.removeListener('data', onKeypress);
        
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(wasRaw || false);
        }
        
        if (!wasRaw) {
          process.stdin.pause();
        }
        
        if (this.rl) {
          this.rl.close();
          this.rl = null;
        }
        
        // Clear menu and restore screen
        console.log('\x1B[2J\x1B[H');
      };

      // Listen for keypress
      process.stdin.on('data', onKeypress);
    });
  }
}