import inquirer from 'inquirer';
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
    
    try {
      const { theme } = await inquirer.prompt([
        {
          type: 'list',
          name: 'theme',
          message: 'Select a theme:',
          choices: themes.map(t => ({
            name: t === currentTheme ? `${t} (current)` : t,
            value: t
          })),
          default: currentTheme,
          loop: false,
          pageSize: 10
        }
      ]);

      if (theme && theme !== currentTheme) {
        this.themeManager.setTheme(theme);
        this.settingsManager.setTheme(theme);
        console.log(`\nTheme changed to: ${theme}\n`);
        return true; // Theme changed
      }
    } catch (error) {
      // User cancelled - just return false, don't exit
      console.log('\nTheme selection cancelled\n');
      return false;
    }
    
    return false; // No change
  }
}