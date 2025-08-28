import { ModelManager } from '../services/modelManager';
import { SettingsManager } from '../services/settingsManager';
import { ThemeManager } from './themeManager';
export declare class ModelSelector {
    private modelManager;
    private settingsManager;
    private themeManager;
    constructor(modelManager: ModelManager, settingsManager: SettingsManager, themeManager: ThemeManager);
    selectModel(): Promise<boolean>;
    private formatModelChoice;
}
//# sourceMappingURL=modelSelector.d.ts.map