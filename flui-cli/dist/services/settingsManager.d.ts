export interface Settings {
    theme: string;
    model: string;
    modelIndex: number;
}
export declare class SettingsManager {
    private settingsPath;
    private settings;
    private defaultSettings;
    constructor();
    private loadSettings;
    saveSettings(): void;
    getTheme(): string;
    setTheme(theme: string): void;
    getModel(): string;
    getModelIndex(): number;
    setModel(model: string, index: number): void;
    getAllSettings(): Settings;
}
//# sourceMappingURL=settingsManager.d.ts.map