"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeManager = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class ThemeManager {
    constructor() {
        this.configPath = path.join(os.homedir(), '.flui-cli-theme');
        this.themes = this.initializeThemes();
        this.currentTheme = this.themes.get('dark');
        this.loadThemePreference();
    }
    initializeThemes() {
        const themes = new Map();
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
    getCurrentTheme() {
        return this.currentTheme;
    }
    getAvailableThemes() {
        return Array.from(this.themes.keys());
    }
    setTheme(themeName) {
        const theme = this.themes.get(themeName);
        if (!theme) {
            throw new Error('Theme not found');
        }
        this.currentTheme = theme;
        this.saveThemePreference(themeName);
    }
    getFormattedThemeList() {
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
    formatUserMessage(message) {
        const color = this.currentTheme.colors.userMessage;
        return chalk_1.default[color](message);
    }
    formatAssistantMessage(message) {
        const color = this.currentTheme.colors.assistantMessage;
        return chalk_1.default[color](message);
    }
    formatSystemMessage(message) {
        const color = this.currentTheme.colors.systemMessage;
        return chalk_1.default[color](message);
    }
    formatError(message) {
        const color = this.currentTheme.colors.error;
        return chalk_1.default[color](message);
    }
    formatPrimary(message) {
        const color = this.currentTheme.colors.primary;
        return chalk_1.default[color](message);
    }
    formatSecondary(message) {
        const color = this.currentTheme.colors.secondary;
        return chalk_1.default[color](message);
    }
    formatBorder(message) {
        const color = this.currentTheme.colors.border;
        return chalk_1.default[color](message);
    }
    formatWarning(message) {
        const color = this.currentTheme.colors.warning;
        return chalk_1.default[color](message);
    }
    formatInfo(message) {
        const color = this.currentTheme.colors.info;
        return chalk_1.default[color](message);
    }
    formatSuccess(message) {
        return chalk_1.default.green(message);
    }
    formatHighlight(message) {
        return chalk_1.default.bgBlue.white(message);
    }
    formatDim(message) {
        return chalk_1.default.gray(message);
    }
    formatPrompt(message) {
        return chalk_1.default.cyan.bold(message);
    }
    // Persistence methods
    saveThemePreference(themeName) {
        try {
            fs.writeFileSync(this.configPath, themeName, 'utf-8');
        }
        catch (error) {
            // Silently fail if can't save preference
        }
    }
    loadThemePreference() {
        try {
            if (fs.existsSync(this.configPath)) {
                const themeName = fs.readFileSync(this.configPath, 'utf-8').trim();
                if (this.themes.has(themeName)) {
                    this.currentTheme = this.themes.get(themeName);
                }
            }
        }
        catch (error) {
            // Use default theme if can't load preference
        }
    }
}
exports.ThemeManager = ThemeManager;
//# sourceMappingURL=themeManager.js.map