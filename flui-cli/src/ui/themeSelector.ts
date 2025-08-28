import { ThemeManager } from './themeManager';
import { SettingsManager } from '../services/settingsManager';
import { InteractiveSelector, SelectorOption } from './interactiveSelector';

export class ThemeSelector {
  private selector: InteractiveSelector;
  
  constructor(
    private themeManager: ThemeManager,
    private settingsManager: SettingsManager
  ) {
    this.selector = new InteractiveSelector(themeManager);
  }

  async selectTheme(): Promise<boolean> {
    const themes = this.themeManager.getAvailableThemes();
    const currentTheme = this.themeManager.getCurrentTheme().name;
    
    // Prepare options for selector
    const options: SelectorOption[] = themes.map(theme => ({
      label: theme,
      value: theme
    }));
    
    // Show interactive selector
    const selectedTheme = await this.selector.select(
      '🎨 Select Theme',
      options,
      currentTheme
    );
    
    if (selectedTheme && selectedTheme !== currentTheme) {
      this.themeManager.setTheme(selectedTheme);
      this.settingsManager.setTheme(selectedTheme);
      console.log(this.themeManager.formatSuccess(`\n✓ Theme changed to: ${selectedTheme}\n`));
      return true;
    }
    
    console.log(this.themeManager.formatDim('\nTheme selection cancelled\n'));
    return false;
  }
}