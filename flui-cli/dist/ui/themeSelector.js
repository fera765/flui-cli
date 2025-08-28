"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeSelector = void 0;
const interactiveSelector_1 = require("./interactiveSelector");
class ThemeSelector {
    constructor(themeManager, settingsManager) {
        this.themeManager = themeManager;
        this.settingsManager = settingsManager;
        this.selector = new interactiveSelector_1.InteractiveSelector(themeManager);
    }
    async selectTheme() {
        const themes = this.themeManager.getAvailableThemes();
        const currentTheme = this.themeManager.getCurrentTheme().name;
        // Prepare options for selector
        const options = themes.map(theme => ({
            label: theme,
            value: theme
        }));
        // Show interactive selector
        const selectedTheme = await this.selector.select('🎨 Select Theme', options, currentTheme);
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
exports.ThemeSelector = ThemeSelector;
//# sourceMappingURL=themeSelector.js.map