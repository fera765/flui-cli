import { ThemeManager } from './themeManager';
import { SettingsManager } from '../services/settingsManager';
export declare class ThemeSelector {
    private themeManager;
    private settingsManager;
    private selector;
    constructor(themeManager: ThemeManager, settingsManager: SettingsManager);
    selectTheme(): Promise<boolean>;
}
//# sourceMappingURL=themeSelector.d.ts.map