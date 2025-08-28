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
    
    // Create custom prompt with live preview
    const prompt = inquirer.createPromptModule();
    
    try {
      const { theme } = await prompt([
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
        return true; // Theme changed
      }
    } catch (error) {
      // User cancelled
      return false;
    }
    
    return false; // No change
  }
}