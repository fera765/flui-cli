import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ThemeColors {
  primary: string;
  secondary: string;
  userMessage: string;
  assistantMessage: string;
  systemMessage: string;
  error: string;
  warning: string;
  info: string;
  background: string;
  border: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

export class ThemeManager {
  private currentTheme: Theme;
  private themes: Map<string, Theme>;
  private configPath: string;

  constructor() {
    this.configPath = path.join(os.homedir(), '.flui-cli-theme');
    this.themes = this.initializeThemes();
    this.currentTheme = this.themes.get('dark')!;
    this.loadThemePreference();
  }

  private initializeThemes(): Map<string, Theme> {
    const themes = new Map<string, Theme>();

    // Dark theme
    themes.set('dark', {
      name: 'dark',
      colors: {
        primary: 'cyan',
        secondary: 'blue',
        userMessage: 'gray',
        assistantMessage: 'white',
        systemMessage: 'yellow',
        error: 'red',
        warning: 'yellow',
        info: 'cyan',
        background: 'black',
        border: 'gray'
      }
    });

    // Light theme
    themes.set('light', {
      name: 'light',
      colors: {
        primary: 'blue',
        secondary: 'cyan',
        userMessage: 'blackBright',
        assistantMessage: 'black',
        systemMessage: 'magenta',
        error: 'red',
        warning: 'yellow',
        info: 'blue',
        background: 'white',
        border: 'blackBright'
      }
    });

    // Monokai theme
    themes.set('monokai', {
      name: 'monokai',
      colors: {
        primary: 'magenta',
        secondary: 'green',
        userMessage: 'gray',
        assistantMessage: 'yellow',
        systemMessage: 'cyan',
        error: 'red',
        warning: 'yellow',
        info: 'blue',
        background: 'black',
        border: 'gray'
      }
    });

    // Dracula theme
    themes.set('dracula', {
      name: 'dracula',
      colors: {
        primary: 'magentaBright',
        secondary: 'cyanBright',
        userMessage: 'gray',
        assistantMessage: 'greenBright',
        systemMessage: 'yellowBright',
        error: 'redBright',
        warning: 'yellow',
        info: 'blueBright',
        background: 'black',
        border: 'gray'
      }
    });

    // Solarized theme
    themes.set('solarized', {
      name: 'solarized',
      colors: {
        primary: 'yellow',
        secondary: 'blue',
        userMessage: 'gray',
        assistantMessage: 'green',
        systemMessage: 'cyan',
        error: 'red',
        warning: 'magenta',
        info: 'blue',
        background: 'black',
        border: 'gray'
      }
    });

    // Nord theme
    themes.set('nord', {
      name: 'nord',
      colors: {
        primary: 'blueBright',
        secondary: 'cyanBright',
        userMessage: 'gray',
        assistantMessage: 'white',
        systemMessage: 'blue',
        error: 'red',
        warning: 'yellow',
        info: 'cyan',
        background: 'black',
        border: 'blackBright'
      }
    });

    // Gruvbox theme
    themes.set('gruvbox', {
      name: 'gruvbox',
      colors: {
        primary: 'yellow',
        secondary: 'green',
        userMessage: 'gray',
        assistantMessage: 'yellowBright',
        systemMessage: 'blue',
        error: 'red',
        warning: 'magenta',
        info: 'cyan',
        background: 'black',
        border: 'gray'
      }
    });

    // Tokyo Night theme
    themes.set('tokyo-night', {
      name: 'tokyo-night',
      colors: {
        primary: 'blueBright',
        secondary: 'magentaBright',
        userMessage: 'gray',
        assistantMessage: 'cyanBright',
        systemMessage: 'blue',
        error: 'redBright',
        warning: 'yellow',
        info: 'cyan',
        background: 'black',
        border: 'blackBright'
      }
    });

    // Synthwave theme
    themes.set('synthwave', {
      name: 'synthwave',
      colors: {
        primary: 'magentaBright',
        secondary: 'cyanBright',
        userMessage: 'magenta',
        assistantMessage: 'cyan',
        systemMessage: 'yellowBright',
        error: 'redBright',
        warning: 'yellow',
        info: 'blueBright',
        background: 'black',
        border: 'magenta'
      }
    });

    // Cyberpunk theme
    themes.set('cyberpunk', {
      name: 'cyberpunk',
      colors: {
        primary: 'greenBright',
        secondary: 'yellowBright',
        userMessage: 'green',
        assistantMessage: 'yellow',
        systemMessage: 'cyanBright',
        error: 'redBright',
        warning: 'magentaBright',
        info: 'blueBright',
        background: 'black',
        border: 'green'
      }
    });

    return themes;
  }

  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  getAvailableThemes(): string[] {
    return Array.from(this.themes.keys());
  }

  setTheme(themeName: string): void {
    const theme = this.themes.get(themeName);
    if (!theme) {
      throw new Error('Theme not found');
    }
    this.currentTheme = theme;
    this.saveThemePreference(themeName);
  }

  getFormattedThemeList(): string {
    const themes = Array.from(this.themes.values());
    return themes
      .map(theme => {
        const isCurrent = theme.name === this.currentTheme.name;
        const indicator = isCurrent ? ' (current)' : '';
        return `${theme.name}${indicator}`;
      })
      .join('\n');
  }

  // Color formatting methods
  formatUserMessage(message: string): string {
    const color = this.currentTheme.colors.userMessage;
    return (chalk as any)[color](message);
  }

  formatAssistantMessage(message: string): string {
    const color = this.currentTheme.colors.assistantMessage;
    return (chalk as any)[color](message);
  }

  formatSystemMessage(message: string): string {
    const color = this.currentTheme.colors.systemMessage;
    return (chalk as any)[color](message);
  }

  formatError(message: string): string {
    const color = this.currentTheme.colors.error;
    return (chalk as any)[color](message);
  }

  formatPrimary(message: string): string {
    const color = this.currentTheme.colors.primary;
    return (chalk as any)[color](message);
  }

  formatSecondary(message: string): string {
    const color = this.currentTheme.colors.secondary;
    return (chalk as any)[color](message);
  }

  formatBorder(message: string): string {
    const color = this.currentTheme.colors.border;
    return (chalk as any)[color](message);
  }

  formatWarning(message: string): string {
    const color = this.currentTheme.colors.warning;
    return (chalk as any)[color](message);
  }

  formatInfo(message: string): string {
    const color = this.currentTheme.colors.info;
    return (chalk as any)[color](message);
  }

  formatSuccess(message: string): string {
    return chalk.green(message);
  }

  formatHighlight(message: string): string {
    return chalk.bgBlue.white(message);
  }

  formatDim(message: string): string {
    return chalk.gray(message);
  }

  // Persistence methods
  saveThemePreference(themeName: string): void {
    try {
      fs.writeFileSync(this.configPath, themeName, 'utf-8');
    } catch (error) {
      // Silently fail if can't save preference
    }
  }

  loadThemePreference(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const themeName = fs.readFileSync(this.configPath, 'utf-8').trim();
        if (this.themes.has(themeName)) {
          this.currentTheme = this.themes.get(themeName)!;
        }
      }
    } catch (error) {
      // Use default theme if can't load preference
    }
  }
}