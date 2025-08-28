import { ModelManager } from '../services/modelManager';
import { ApiService, Model } from '../services/apiService';

jest.mock('../services/apiService');

describe('ModelManager', () => {
  let modelManager: ModelManager;
  let mockApiService: jest.Mocked<ApiService>;

  const mockModels: Model[] = [
    { id: 'claude-3-opus', context_length: 200000, description: 'Claude 3 Opus - Most powerful' },
    { id: 'gpt-4-turbo', context_length: 128000, description: 'GPT-4 Turbo - Fast and smart' },
    { id: 'mistral-large', context_length: 64000, description: 'Mistral Large - Efficient' }
  ];

  beforeEach(() => {
    mockApiService = new ApiService() as jest.Mocked<ApiService>;
    mockApiService.fetchModels.mockResolvedValue(mockModels);
    modelManager = new ModelManager(mockApiService);
  });

  describe('initialization', () => {
    it('should load models on initialization', async () => {
      await modelManager.initialize();

      expect(mockApiService.fetchModels).toHaveBeenCalled();
      expect(modelManager.getAvailableModels()).toEqual(mockModels);
    });

    it('should set first model as default', async () => {
      await modelManager.initialize();

      expect(modelManager.getCurrentModel()).toEqual(mockModels[0]);
    });

    it('should handle initialization errors', async () => {
      mockApiService.fetchModels.mockRejectedValue(new Error('Network error'));

      await expect(modelManager.initialize()).rejects.toThrow('Failed to initialize models');
    });
  });

  describe('model selection', () => {
    beforeEach(async () => {
      await modelManager.initialize();
    });

    it('should switch model by index (1-based)', () => {
      modelManager.selectModel(2);
      expect(modelManager.getCurrentModel()).toEqual(mockModels[1]);

      modelManager.selectModel(3);
      expect(modelManager.getCurrentModel()).toEqual(mockModels[2]);
    });

    it('should handle invalid model index', () => {
      expect(() => modelManager.selectModel(0)).toThrow('Invalid model index');
      expect(() => modelManager.selectModel(4)).toThrow('Invalid model index');
      expect(() => modelManager.selectModel(-1)).toThrow('Invalid model index');
    });

    it('should keep current model on invalid selection', () => {
      const currentModel = modelManager.getCurrentModel();
      
      try {
        modelManager.selectModel(10);
      } catch (e) {
        // Expected error
      }

      expect(modelManager.getCurrentModel()).toEqual(currentModel);
    });
  });

  describe('model information', () => {
    beforeEach(async () => {
      await modelManager.initialize();
    });

    it('should format model list for display', () => {
      const formattedList = modelManager.getFormattedModelList();

      expect(formattedList).toContain('[1]');
      expect(formattedList).toContain('[2]');
      expect(formattedList).toContain('[3]');
      expect(formattedList).toContain('Claude 3 Opus');
      expect(formattedList).toContain('200,000');
      expect(formattedList).toContain('(current)');
    });

    it('should indicate current model in formatted list', () => {
      modelManager.selectModel(2);
      const formattedList = modelManager.getFormattedModelList();

      expect(formattedList).toMatch(/\[2\].*\(current\)/);
    });

    it('should get current model ID for API calls', () => {
      expect(modelManager.getCurrentModelId()).toBe('claude-3-opus');
      
      modelManager.selectModel(2);
      expect(modelManager.getCurrentModelId()).toBe('gpt-4-turbo');
    });
  });
});