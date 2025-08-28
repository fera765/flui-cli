"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelManager = void 0;
const chalk_1 = __importDefault(require("chalk"));
class ModelManager {
    constructor(apiService) {
        this.apiService = apiService;
        this.models = [];
        this.currentModelIndex = 0;
    }
    async initialize() {
        try {
            this.models = await this.apiService.fetchModels();
            if (this.models.length === 0) {
                throw new Error('No models available');
            }
            this.currentModelIndex = 0;
        }
        catch (error) {
            throw new Error('Failed to initialize models');
        }
    }
    selectModel(index) {
        // Convert from 1-based to 0-based index
        const zeroBasedIndex = index - 1;
        if (zeroBasedIndex < 0 || zeroBasedIndex >= this.models.length) {
            throw new Error('Invalid model index');
        }
        this.currentModelIndex = zeroBasedIndex;
    }
    getCurrentModel() {
        return this.models[this.currentModelIndex];
    }
    getCurrentModelId() {
        return this.getCurrentModel().id;
    }
    getAvailableModels() {
        return [...this.models];
    }
    getFormattedModelList() {
        return this.models
            .map((model, index) => {
            const isCurrent = index === this.currentModelIndex;
            const modelNumber = chalk_1.default.cyan(`[${index + 1}]`);
            const modelName = chalk_1.default.bold(model.id);
            const contextInfo = chalk_1.default.gray(`(${model.context_length.toLocaleString()} tokens)`);
            const description = chalk_1.default.white(model.description);
            const currentIndicator = isCurrent ? chalk_1.default.green(' (current)') : '';
            return `${modelNumber} ${modelName} ${contextInfo}${currentIndicator}\n    ${description}`;
        })
            .join('\n\n');
    }
}
exports.ModelManager = ModelManager;
//# sourceMappingURL=modelManager.js.map