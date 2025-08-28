"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelSelector = void 0;
class ModelSelector {
    constructor(modelManager, settingsManager, themeManager) {
        this.modelManager = modelManager;
        this.settingsManager = settingsManager;
        this.themeManager = themeManager;
    }
    async selectModel() {
        const models = this.modelManager.getAvailableModels();
        const currentModel = this.modelManager.getCurrentModel();
        // Display available models
        console.log('\n📋 Available Models:\n');
        models.forEach((model, index) => {
            const isCurrent = model.id === currentModel.id;
            const marker = isCurrent ? ' (current)' : '';
            console.log(`[${index + 1}] ${model.id} (${(model.context_length / 1000).toFixed(0)}k tokens)${marker}`);
            if (model.description) {
                console.log(`    ${model.description}`);
            }
        });
        console.log('\nEnter model number (1-3) or press Enter to cancel:');
        // Simple number input - no inquirer to avoid process termination
        return new Promise((resolve) => {
            const stdin = process.stdin;
            stdin.setRawMode(true);
            stdin.resume();
            let input = '';
            const handler = (key) => {
                const char = key.toString();
                if (char === '\r' || char === '\n') {
                    // Enter pressed
                    stdin.setRawMode(false);
                    stdin.pause();
                    stdin.removeListener('data', handler);
                    const modelIndex = parseInt(input);
                    if (modelIndex >= 1 && modelIndex <= models.length) {
                        this.modelManager.selectModel(modelIndex);
                        const newModel = this.modelManager.getCurrentModel();
                        this.settingsManager.setModel(newModel.id, modelIndex);
                        console.log(`\nModel changed to: ${newModel.id}\n`);
                        resolve(true);
                    }
                    else {
                        console.log('\nModel selection cancelled\n');
                        resolve(false);
                    }
                }
                else if (char === '\x03' || char === '\x1b') {
                    // Ctrl+C or ESC
                    stdin.setRawMode(false);
                    stdin.pause();
                    stdin.removeListener('data', handler);
                    console.log('\nModel selection cancelled\n');
                    resolve(false);
                }
                else if (char >= '1' && char <= '3') {
                    input = char;
                    process.stdout.write(char);
                }
            };
            stdin.on('data', handler);
        });
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