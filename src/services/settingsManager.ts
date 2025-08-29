import * as fs from 'fs';
import * as path from 'path';

export interface Settings {
  theme: string;
  model: string;
  modelIndex: number;
}

export class SettingsManager {
  private settingsPath: string;
  private settings: Settings;
  private defaultSettings: Settings = {
    theme: 'dark',
    model: 'deepseek-r1-0528',
    modelIndex: 1
  };

  constructor() {
    // Create .flui directory in current working directory
    const fluiDir = path.join(process.cwd(), '.flui');
    if (!fs.existsSync(fluiDir)) {
      fs.mkdirSync(fluiDir, { recursive: true });
    }
    
    this.settingsPath = path.join(fluiDir, 'settings.json');
    this.settings = this.loadSettings();
  }

  private loadSettings(): Settings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        return { ...this.defaultSettings, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return { ...this.defaultSettings };
  }

  saveSettings(): void {
    try {
      fs.writeFileSync(
        this.settingsPath,
        JSON.stringify(this.settings, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  getTheme(): string {
    return this.settings.theme;
  }

  setTheme(theme: string): void {
    this.settings.theme = theme;
    this.saveSettings();
  }

  getModel(): string {
    return this.settings.model;
  }

  getModelIndex(): number {
    return this.settings.modelIndex;
  }

  setModel(model: string, index: number): void {
    this.settings.model = model;
    this.settings.modelIndex = index;
    this.saveSettings();
  }

  getAllSettings(): Settings {
    return { ...this.settings };
  }
}