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
        try {
            const { theme } = await inquirer_1.default.prompt([
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
        }
        catch (error) {
            // User cancelled - just return false, don't exit
            console.log('\nTheme selection cancelled\n');
            return false;
        }
        return false; // No change
    }
}
exports.ThemeSelector = ThemeSelector;
//# sourceMappingURL=themeSelector.js.map