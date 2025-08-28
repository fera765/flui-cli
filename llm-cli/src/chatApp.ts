import { ApiService, Message } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';

export class ChatApp {
  private conversationHistory: Message[] = [];
  private isRunning: boolean = false;

  constructor(
    private apiService: ApiService,
    private modelManager: ModelManager,
    private chatUI: ChatUI
  ) {}

  async initialize(): Promise<void> {
    try {
      await this.modelManager.initialize();
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
        if (parts.length === 1) {
          // Show model list
          this.chatUI.displayModels(this.modelManager.getFormattedModelList());
        } else {
          // Change model
          const index = parseInt(parts[1]);
          if (isNaN(index)) {
            this.chatUI.displayError('Por favor, forneça um número válido (1-3)');
          } else {
            try {
              this.modelManager.selectModel(index);
              const currentModel = this.modelManager.getCurrentModel();
              this.chatUI.displayMessage(
                `Modelo alterado para: ${currentModel.id}`,
                'system'
              );
            } catch (error) {
              this.chatUI.displayError(`Índice de modelo inválido. Use /model para ver os modelos disponíveis.`);
            }
          }
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