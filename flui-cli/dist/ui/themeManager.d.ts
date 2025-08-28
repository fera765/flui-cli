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
export declare class ThemeManager {
    private currentTheme;
    private themes;
    private configPath;
    constructor();
    private initializeThemes;
    getCurrentTheme(): Theme;
    getAvailableThemes(): string[];
    setTheme(themeName: string): void;
    getFormattedThemeList(): string;
    formatUserMessage(message: string): string;
    formatAssistantMessage(message: string): string;
    formatSystemMessage(message: string): string;
    formatError(message: string): string;
    formatPrimary(message: string): string;
    formatSecondary(message: string): string;
    formatBorder(message: string): string;
    formatWarning(message: string): string;
    formatInfo(message: string): string;
    saveThemePreference(themeName: string): void;
    loadThemePreference(): void;
}
//# sourceMappingURL=themeManager.d.ts.map