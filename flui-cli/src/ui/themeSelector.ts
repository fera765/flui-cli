import { ThemeManager } from './themeManager';
import { SettingsManager } from '../services/settingsManager';

export class ThemeSelector {
  constructor(
    private themeManager: ThemeManager,
    private settingsManager: SettingsManager
  ) {}

  async selectTheme(): Promise<boolean> {
    const themes = this.themeManager.getAvailableThemes();
    const currentTheme = this.themeManager.getCurrentTheme().name;
    
    // Display available themes
    console.log('\n🎨 Available Themes:\n');
    themes.forEach((theme, index) => {
      const isCurrent = theme === currentTheme;
      const marker = isCurrent ? ' (current)' : '';
      console.log(`[${index + 1}] ${theme}${marker}`);
    });
    
    console.log('\nEnter theme number (1-10) or press Enter to cancel:');
    
    // Simple number input - no inquirer
    return new Promise((resolve) => {
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();
      
      let input = '';
      
      const handler = (key: Buffer) => {
        const char = key.toString();
        
        if (char === '\r' || char === '\n') {
          // Enter pressed
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', handler);
          
          const themeIndex = parseInt(input);
          if (themeIndex >= 1 && themeIndex <= themes.length) {
            const selectedTheme = themes[themeIndex - 1];
            this.themeManager.setTheme(selectedTheme);
            this.settingsManager.setTheme(selectedTheme);
            console.log(`\nTheme changed to: ${selectedTheme}\n`);
            resolve(true);
          } else {
            console.log('\nTheme selection cancelled\n');
            resolve(false);
          }
        } else if (char === '\x03' || char === '\x1b') {
          // Ctrl+C or ESC
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', handler);
          console.log('\nTheme selection cancelled\n');
          resolve(false);
        } else if (char >= '0' && char <= '9') {
          if (input.length < 2) {
            input += char;
            process.stdout.write(char);
          }
        } else if (char === '\x7f' || char === '\b') {
          // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
        }
      };
      
      stdin.on('data', handler);
    });
  }
}