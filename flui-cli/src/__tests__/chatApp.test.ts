import { ChatApp } from '../chatApp';
import { ApiService } from '../services/apiService';
import { ModelManager } from '../services/modelManager';
import { ChatUI } from '../ui/chatUI';

jest.mock('../services/apiService');
jest.mock('../services/modelManager');
jest.mock('../ui/chatUI');

describe('ChatApp', () => {
  let chatApp: ChatApp;
  let mockApiService: jest.Mocked<ApiService>;
  let mockModelManager: jest.Mocked<ModelManager>;
  let mockChatUI: jest.Mocked<ChatUI>;

  beforeEach(() => {
    mockApiService = new ApiService() as jest.Mocked<ApiService>;
    mockModelManager = new ModelManager(mockApiService) as jest.Mocked<ModelManager>;
    mockChatUI = new ChatUI() as jest.Mocked<ChatUI>;
    
    chatApp = new ChatApp(mockApiService, mockModelManager, mockChatUI);

    // Setup default mocks
    mockModelManager.getCurrentModelId.mockReturnValue('gpt-4-turbo');
    mockChatUI.getUserInput.mockResolvedValue('Hello');
    mockApiService.sendMessage.mockResolvedValue('Hello! How can I help you?');
  });

  describe('initialization', () => {
    it('should initialize and display welcome message', async () => {
      await chatApp.initialize();

      expect(mockModelManager.initialize).toHaveBeenCalled();
      expect(mockChatUI.displayDisclaimer).toHaveBeenCalled();
      expect(mockChatUI.displayWelcome).toHaveBeenCalled();
      expect(mockChatUI.displayModels).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockModelManager.initialize.mockRejectedValue(new Error('Network error'));

      await expect(chatApp.initialize()).rejects.toThrow('Failed to initialize chat');
      expect(mockChatUI.displayError).toHaveBeenCalled();
    });
  });

  describe('command processing', () => {
    beforeEach(async () => {
      await chatApp.initialize();
    });

    it('should handle /exit command', async () => {
      mockChatUI.getUserInput.mockResolvedValueOnce('/exit');

      const result = await chatApp.processInput();

      expect(result).toBe(false);
      expect(mockChatUI.displayMessage).toHaveBeenCalledWith('Encerrando chat. Até logo!', 'system');
    });

    it('should handle /model command with valid index', async () => {
      mockChatUI.getUserInput.mockResolvedValueOnce('/model 2');
      mockModelManager.selectModel.mockImplementation(() => {});
      mockModelManager.getCurrentModel.mockReturnValue({
        id: 'claude-3-opus',
        context_length: 200000,
        description: 'Claude 3 Opus'
      });

      const result = await chatApp.processInput();

      expect(result).toBe(true);
      expect(mockModelManager.selectModel).toHaveBeenCalledWith(2);
      expect(mockChatUI.displayMessage).toHaveBeenCalledWith(
        expect.stringContaining('Modelo alterado para: claude-3-opus'),
        'system'
      );
    });

    it('should handle /model command with invalid index', async () => {
      mockChatUI.getUserInput.mockResolvedValueOnce('/model 5');
      mockModelManager.selectModel.mockImplementation(() => {
        throw new Error('Invalid model index');
      });

      const result = await chatApp.processInput();

      expect(result).toBe(true);
      expect(mockChatUI.displayError).toHaveBeenCalledWith(
        expect.stringContaining('Índice de modelo inválido')
      );
    });

    it('should handle /model command without index', async () => {
      mockChatUI.getUserInput.mockResolvedValueOnce('/model');
      mockModelManager.getFormattedModelList.mockReturnValue('Model list');

      const result = await chatApp.processInput();

      expect(result).toBe(true);
      expect(mockChatUI.displayModels).toHaveBeenCalledWith('Model list');
    });
  });

  describe('chat conversation', () => {
    beforeEach(async () => {
      await chatApp.initialize();
    });

    it('should send message and display response', async () => {
      mockChatUI.getUserInput.mockResolvedValueOnce('Hello AI');
      mockApiService.sendMessage.mockResolvedValueOnce('Hello! I am here to help.');

      const result = await chatApp.processInput();

      expect(result).toBe(true);
      expect(mockChatUI.showThinking).toHaveBeenCalled();
      expect(mockApiService.sendMessage).toHaveBeenCalledWith(
        'Hello AI',
        'gpt-4-turbo',
        [],
        expect.any(Object)
      );
      expect(mockChatUI.hideThinking).toHaveBeenCalled();
      expect(mockChatUI.displayMessage).toHaveBeenCalledWith('Hello AI', 'user');
      expect(mockChatUI.displayMessage).toHaveBeenCalledWith('Hello! I am here to help.', 'assistant');
    });

    it('should maintain conversation history', async () => {
      // First message
      mockChatUI.getUserInput.mockResolvedValueOnce('Hello');
      mockApiService.sendMessage.mockResolvedValueOnce('Hi there!');
      await chatApp.processInput();

      // Second message
      mockChatUI.getUserInput.mockResolvedValueOnce('How are you?');
      mockApiService.sendMessage.mockResolvedValueOnce('I am doing great!');
      await chatApp.processInput();

      expect(mockApiService.sendMessage).toHaveBeenLastCalledWith(
        'How are you?',
        'gpt-4-turbo',
        [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' }
        ],
        undefined // AbortSignal parameter
      );
    });

    it('should handle API errors gracefully', async () => {
      mockChatUI.getUserInput.mockResolvedValueOnce('Test message');
      mockApiService.sendMessage.mockRejectedValueOnce(new Error('API Error'));

      const result = await chatApp.processInput();

      expect(result).toBe(true);
      expect(mockChatUI.showThinking).toHaveBeenCalled();
      expect(mockChatUI.hideThinking).toHaveBeenCalled();
      expect(mockChatUI.displayError).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao enviar mensagem')
      );
    });

    it('should handle empty input', async () => {
      mockChatUI.getUserInput.mockResolvedValueOnce('');

      const result = await chatApp.processInput();

      expect(result).toBe(true);
      expect(mockApiService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('run method', () => {
    it('should run chat loop until exit', async () => {
      let callCount = 0;
      mockChatUI.getUserInput.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return 'Hello';
        if (callCount === 2) return 'How are you?';
        return '/exit';
      });

      mockApiService.sendMessage.mockResolvedValue('Response');

      await chatApp.run();

      expect(mockChatUI.getUserInput).toHaveBeenCalledTimes(3);
      expect(mockApiService.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockChatUI.displayMessage).toHaveBeenCalledWith('Encerrando chat. Até logo!', 'system');
    });

    it('should handle errors in run loop', async () => {
      mockModelManager.initialize.mockRejectedValue(new Error('Init error'));

      await chatApp.run();

      expect(mockChatUI.displayError).toHaveBeenCalledWith(
        expect.stringContaining('Erro fatal')
      );
    });
  });
});