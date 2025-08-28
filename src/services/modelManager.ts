import { ApiService, Model } from './apiService';
import chalk from 'chalk';

export class ModelManager {
  private models: Model[] = [];
  private currentModelIndex: number = 0;

  constructor(private apiService: ApiService) {}

  async initialize(): Promise<void> {
    try {
      this.models = await this.apiService.fetchModels();
      if (this.models.length === 0) {
        throw new Error('No models available');
      }
      this.currentModelIndex = 0;
    } catch (error) {
      throw new Error('Failed to initialize models');
    }
  }

  selectModel(index: number): void {
    // Convert from 1-based to 0-based index
    const zeroBasedIndex = index - 1;
    
    if (zeroBasedIndex < 0 || zeroBasedIndex >= this.models.length) {
      throw new Error('Invalid model index');
    }

    this.currentModelIndex = zeroBasedIndex;
  }

  getCurrentModel(): Model {
    return this.models[this.currentModelIndex];
  }

  getCurrentModelId(): string {
    return this.getCurrentModel().id;
  }

  getAvailableModels(): Model[] {
    return [...this.models];
  }

  getFormattedModelList(): string {
    return this.models
      .map((model, index) => {
        const isCurrent = index === this.currentModelIndex;
        const modelNumber = chalk.cyan(`[${index + 1}]`);
        const modelName = chalk.bold(model.id);
        const contextInfo = chalk.gray(`(${model.context_length.toLocaleString()} tokens)`);
        const description = chalk.white(model.description);
        const currentIndicator = isCurrent ? chalk.green(' (current)') : '';

        return `${modelNumber} ${modelName} ${contextInfo}${currentIndicator}\n    ${description}`;
      })
      .join('\n\n');
  }
}