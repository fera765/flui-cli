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
  private currentRequest: AbortController | null = null;

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
      
      // Setup ESC key handler
      this.setupEscapeHandler();
      
      this.chatUI.displayDisclaimer();
      this.chatUI.displayWelcome();
      this.chatUI.displayModels(this.modelManager.getFormattedModelList());
    } catch (error) {
      this.chatUI.displayError(`Erro ao inicializar: ${error}`);
      throw new Error('Failed to initialize chat');
    }
  }

  private setupEscapeHandler(): void {
    process.stdin.on('keypress', (str, key) => {
      if (key && key.name === 'escape') {
        this.handleEscape();
      }
    });
  }

  private handleEscape(): void {
    if (this.currentRequest) {
      // Abort current API request
      this.currentRequest.abort();
      this.currentRequest = null;
      this.chatUI.hideThinking();
      console.log('\n⚠️ Action aborted\n');
      this.chatUI.getInputBox().display();
    }
  }

  async processInput(): Promise<boolean> {
    try {
      const input = await this.chatUI.getUserInput();

      if (!input || input.trim() === '') {
        return true;
      }

      // Check for commands
      if (input.startsWith('/')) {
        const shouldContinue = await this.handleCommand(input);
        // Always return true unless it's /exit
        return shouldContinue;
      }

      // Regular message
      await this.sendMessage(input);
      return true;
    } catch (error) {
      // Don't exit on errors, just show them and continue
      console.error('Error processing input:', error);
      return true;
    }
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
        try {
          const modelChanged = await this.modelSelector.selectModel();
          if (modelChanged) {
            // Clear and redraw everything properly
            process.stdout.write('\x1Bc');
            process.stdout.write('\x1B[H');
            this.chatUI.displayWelcome();
            this.chatUI.displayModels(this.modelManager.getFormattedModelList());
            this.chatUI.getTimeline().display(false);
            this.chatUI.getInputBox().display();
          }
        } catch (error) {
          console.log('\nModel selection cancelled\n');
        }
        return true;

      case '/theme':
        // Use interactive theme selector
        try {
          const themeChanged = await this.themeSelector.selectTheme();
          if (themeChanged) {
            // Clear and redraw everything with new theme
            process.stdout.write('\x1Bc');
            process.stdout.write('\x1B[H');
            this.chatUI.displayWelcome();
            this.chatUI.getTimeline().display(false);
            this.chatUI.getInputBox().display();
          }
        } catch (error) {
          console.log('\nTheme selection cancelled\n');
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

      // Create abort controller for this request
      this.currentRequest = new AbortController();

      const response = await this.apiService.sendMessage(
        message,
        this.modelManager.getCurrentModelId(),
        [...this.conversationHistory],  // Send copy of history
        this.currentRequest.signal  // Pass abort signal
      );

      this.currentRequest = null;
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
    } catch (error: any) {
      this.currentRequest = null;
      this.chatUI.hideThinking();
      
      // Don't show error if it was aborted
      if (error.name !== 'AbortError') {
        this.chatUI.displayError(`Erro ao enviar mensagem: ${error}`);
      }
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