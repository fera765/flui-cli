"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeSelector = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
class ThemeSelector {
    constructor(themeManager, settingsManager) {
        this.themeManager = themeManager;
        this.settingsManager = settingsManager;
    }
    async selectTheme() {
        const themes = this.themeManager.getAvailableThemes();
        const currentTheme = this.themeManager.getCurrentTheme().name;
        // Create custom prompt with live preview
        const prompt = inquirer_1.default.createPromptModule();
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
        }
        catch (error) {
            // User cancelled
            return false;
        }
        return false; // No change
    }
}
exports.ThemeSelector = ThemeSelector;
//# sourceMappingURL=themeSelector.js.map