import { ApiService } from '../services/apiService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    apiService = new ApiService();
    jest.clearAllMocks();
  });

  describe('fetchModels', () => {
    it('should fetch and return top 3 models with high token support', async () => {
      const mockModelsResponse = {
        data: {
          data: [
            { id: 'gpt-4-turbo', context_length: 128000, description: 'GPT-4 Turbo' },
            { id: 'claude-3-opus', context_length: 200000, description: 'Claude 3 Opus' },
            { id: 'gemini-pro', context_length: 32000, description: 'Gemini Pro' },
            { id: 'llama-3', context_length: 8000, description: 'Llama 3' },
            { id: 'mistral-large', context_length: 64000, description: 'Mistral Large' },
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockModelsResponse);

      const models = await apiService.fetchModels();

      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.llm7.io/v1/models');
      expect(models).toHaveLength(3);
      expect(models[0].context_length).toBeGreaterThanOrEqual(models[1].context_length);
      expect(models[1].context_length).toBeGreaterThanOrEqual(models[2].context_length);
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(apiService.fetchModels()).rejects.toThrow('Failed to fetch models');
    });
  });

  describe('sendMessage', () => {
    it('should send a message to the LLM and return response', async () => {
      const mockChatResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Hello! How can I help you today?'
              }
            }
          ]
        }
      };

      mockedAxios.post.mockResolvedValue(mockChatResponse);

      const response = await apiService.sendMessage('Hello', 'gpt-4-turbo', []);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.llm7.io/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-4-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
          stream: false
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
      expect(response).toBe('Hello! How can I help you today?');
    });

    it('should include conversation history in messages', async () => {
      const history = [
        { role: 'user' as const, content: 'Hi' },
        { role: 'assistant' as const, content: 'Hello!' }
      ];

      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'I can help with that!'
              }
            }
          ]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await apiService.sendMessage('Help me', 'gpt-4-turbo', history);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.llm7.io/v1/chat/completions',
        expect.objectContaining({
          messages: [
            ...history,
            { role: 'user', content: 'Help me' }
          ]
        }),
        expect.any(Object)
      );
    });

    it('should handle chat API errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      await expect(apiService.sendMessage('Test', 'gpt-4-turbo', [])).rejects.toThrow('Failed to send message');
    });
  });
});