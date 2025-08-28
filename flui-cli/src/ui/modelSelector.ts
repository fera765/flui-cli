import inquirer from 'inquirer';
import { ModelManager } from '../services/modelManager';
import { SettingsManager } from '../services/settingsManager';
import { ThemeManager } from './themeManager';

export class ModelSelector {
  constructor(
    private modelManager: ModelManager,
    private settingsManager: SettingsManager,
    private themeManager: ThemeManager
  ) {}

  async selectModel(): Promise<boolean> {
    const models = this.modelManager.getAvailableModels();
    const currentModel = this.modelManager.getCurrentModel();
    
    const choices = models.map((model, index) => ({
      name: this.formatModelChoice(model, model.id === currentModel.id),
      value: index + 1
    }));
    
    const prompt = inquirer.createPromptModule();
    
    try {
      const { modelIndex } = await prompt([
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
        return true; // Model changed
      }
    } catch (error) {
      // User cancelled
      return false;
    }
    
    return false;
  }

  private formatModelChoice(model: any, isCurrent: boolean): string {
    const name = model.id;
    const context = `${(model.context_length / 1000).toFixed(0)}k tokens`;
    const desc = model.description || '';
    const current = isCurrent ? ' (current)' : '';
    
    return `${name} - ${context}${current}\n  ${desc}`;
  }
}