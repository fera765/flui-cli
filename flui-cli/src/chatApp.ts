import { ApiService, Message } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { SettingsManager } from './services/settingsManager';
import { ChatUI } from './ui/chatUI';
import { ThemeSelector } from './ui/themeSelector';
import { ModelSelector } from './ui/modelSelector';

export class ChatApp {
  private conversationHistory: Message[] = [];
  private isRunning: boolean = false;
  private settingsManager: SettingsManager;
  private themeSelector: ThemeSelector;
  private modelSelector: ModelSelector;

  constructor(
    private apiService: ApiService,
    private modelManager: ModelManager,
    private chatUI: ChatUI
  ) {
    this.settingsManager = new SettingsManager();
    this.themeSelector = new ThemeSelector(
      this.chatUI.getThemeManager(),
      this.settingsManager
    );
    this.modelSelector = new ModelSelector(
      this.modelManager,
      this.settingsManager,
      this.chatUI.getThemeManager()
    );
  }

  async initialize(): Promise<void> {
    try {
      await this.modelManager.initialize();
      
      // Load saved settings
      const settings = this.settingsManager.getAllSettings();
      
      // Apply saved theme
      if (settings.theme) {
        try {
          this.chatUI.getThemeManager().setTheme(settings.theme);
        } catch (e) {
          // Use default if saved theme is invalid
        }
      }
      
      // Apply saved model
      if (settings.modelIndex) {
        try {
          this.modelManager.selectModel(settings.modelIndex);
        } catch (e) {
          // Use default if saved model is invalid
        }
      }
      
      this.chatUI.displayDisclaimer();
      this.chatUI.displayWelcome();
      this.chatUI.displayModels(this.modelManager.getFormattedModelList());
    } catch (error) {
      this.chatUI.displayError(`Erro ao inicializar: ${error}`);
      throw new Error('Failed to initialize chat');
    }
  }

  async processInput(): Promise<boolean> {
    const input = await this.chatUI.getUserInput();

    if (!input || input.trim() === '') {
      return true;
    }

    // Check for commands
    if (input.startsWith('/')) {
      return await this.handleCommand(input);
    }

    // Regular message
    await this.sendMessage(input);
    return true;
  }

  private async handleCommand(command: string): Promise<boolean> {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();

    switch (cmd) {
      case '/exit':
        this.chatUI.displayMessage('Encerrando chat. Até logo!', 'system');
        return false;

      case '/model':
        // Use interactive model selector
        const modelChanged = await this.modelSelector.selectModel();
        if (modelChanged) {
          // Model was changed, display is already updated
          this.chatUI.getTimeline().display(false);
          this.chatUI.getInputBox().display();
        }
        return true;

      case '/theme':
        // Use interactive theme selector
        const themeChanged = await this.themeSelector.selectTheme();
        if (themeChanged) {
          // Refresh display with new theme
          this.chatUI.getTimeline().display(true);
          this.chatUI.getInputBox().display();
        }
        return true;

      default:
        this.chatUI.displayError(`Comando desconhecido: ${cmd}`);
        return true;
    }
  }

  private async sendMessage(message: string): Promise<void> {
    try {
      this.chatUI.displayMessage(message, 'user');
      this.chatUI.showThinking();

      const response = await this.apiService.sendMessage(
        message,
        this.modelManager.getCurrentModelId(),
        [...this.conversationHistory]  // Send copy of history
      );

      this.chatUI.hideThinking();
      this.chatUI.displayMessage(response, 'assistant');

      // Update conversation history AFTER successful response
      this.conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: response }
      );

      // Keep history manageable (last 20 messages)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }
    } catch (error) {
      this.chatUI.hideThinking();
      this.chatUI.displayError(`Erro ao enviar mensagem: ${error}`);
    }
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      this.isRunning = true;

      while (this.isRunning) {
        this.isRunning = await this.processInput();
      }
    } catch (error) {
      this.chatUI.displayError(`Erro fatal: ${error}`);
    }
  }
}