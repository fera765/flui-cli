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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SettingsManager {
    constructor() {
        this.defaultSettings = {
            theme: 'dark',
            model: 'deepseek-r1-0528',
            modelIndex: 1
        };
        // Create .flui directory in current working directory
        const fluiDir = path.join(process.cwd(), '.flui');
        if (!fs.existsSync(fluiDir)) {
            fs.mkdirSync(fluiDir, { recursive: true });
        }
        this.settingsPath = path.join(fluiDir, 'settings.json');
        this.settings = this.loadSettings();
    }
    loadSettings() {
        try {
            if (fs.existsSync(this.settingsPath)) {
                const data = fs.readFileSync(this.settingsPath, 'utf-8');
                return { ...this.defaultSettings, ...JSON.parse(data) };
            }
        }
        catch (error) {
            console.error('Error loading settings:', error);
        }
        return { ...this.defaultSettings };
    }
    saveSettings() {
        try {
            fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    getTheme() {
        return this.settings.theme;
    }
    setTheme(theme) {
        this.settings.theme = theme;
        this.saveSettings();
    }
    getModel() {
        return this.settings.model;
    }
    getModelIndex() {
        return this.settings.modelIndex;
    }
    setModel(model, index) {
        this.settings.model = model;
        this.settings.modelIndex = index;
        this.saveSettings();
    }
    getAllSettings() {
        return { ...this.settings };
    }
}
exports.SettingsManager = SettingsManager;
//# sourceMappingURL=settingsManager.js.map