"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelSelector = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
class ModelSelector {
    constructor(modelManager, settingsManager, themeManager) {
        this.modelManager = modelManager;
        this.settingsManager = settingsManager;
        this.themeManager = themeManager;
    }
    async selectModel() {
        const models = this.modelManager.getAvailableModels();
        const currentModel = this.modelManager.getCurrentModel();
        const choices = models.map((model, index) => ({
            name: this.formatModelChoice(model, model.id === currentModel.id),
            value: index + 1
        }));
        try {
            const { modelIndex } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'modelIndex',
                    message: 'Select a model:',
                    choices,
                    default: models.findIndex(m => m.id === currentModel.id),
                    loop: false,
                    pageSize: 10
                }
            ]);
            if (modelIndex) {
                this.modelManager.selectModel(modelIndex);
                const newModel = this.modelManager.getCurrentModel();
                this.settingsManager.setModel(newModel.id, modelIndex);
                console.log(`\nModel changed to: ${newModel.id}\n`);
                return true; // Model changed
            }
        }
        catch (error) {
            // User cancelled - just return false, don't exit
            console.log('\nModel selection cancelled\n');
            return false;
        }
        return false;
    }
    formatModelChoice(model, isCurrent) {
        const name = model.id;
        const context = `${(model.context_length / 1000).toFixed(0)}k tokens`;
        const desc = model.description || '';
        const current = isCurrent ? ' (current)' : '';
        return `${name} - ${context}${current}\n  ${desc}`;
    }
}
exports.ModelSelector = ModelSelector;
//# sourceMappingURL=modelSelector.js.map