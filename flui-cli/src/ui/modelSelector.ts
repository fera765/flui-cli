import { ModelManager } from '../services/modelManager';
import { SettingsManager } from '../services/settingsManager';
import { ThemeManager } from './themeManager';
import { InteractiveSelector, SelectorOption } from './interactiveSelector';

export class ModelSelector {
  private selector: InteractiveSelector;
  
  constructor(
    private modelManager: ModelManager,
    private settingsManager: SettingsManager,
    private themeManager: ThemeManager
  ) {
    this.selector = new InteractiveSelector(themeManager);
  }

  async selectModel(): Promise<boolean> {
    const models = this.modelManager.getAvailableModels();
    const currentModel = this.modelManager.getCurrentModel();
    
    // Prepare options for selector
    const options: SelectorOption[] = models.map((model, index) => ({
      label: `${model.id} (${(model.context_length / 1000).toFixed(0)}k tokens)`,
      value: index + 1,
      description: model.description || undefined
    }));
    
    // Show interactive selector
    const selectedIndex = await this.selector.select(
      '📋 Select Model',
      options,
      models.findIndex(m => m.id === currentModel.id) + 1
    );
    
    if (selectedIndex && selectedIndex !== models.findIndex(m => m.id === currentModel.id) + 1) {
      this.modelManager.selectModel(selectedIndex);
      const newModel = this.modelManager.getCurrentModel();
      this.settingsManager.setModel(newModel.id, selectedIndex);
      console.log(this.themeManager.formatSuccess(`\n✓ Model changed to: ${newModel.id}\n`));
      return true;
    }
    
    console.log(this.themeManager.formatDim('\nModel selection cancelled\n'));
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