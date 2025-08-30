export class ToolsManager {
  executeTool = jest.fn().mockResolvedValue({
    toolName: 'test',
    status: 'success',
    output: 'test output'
  });
  
  getAvailableTools = jest.fn().mockReturnValue(['file_write', 'shell', 'file_read']);
  getExecutionHistory = jest.fn().mockReturnValue([]);
  clearHistory = jest.fn();
  
  constructor(apiService: any, memoryManager: any, openAIService: any) {
    // Mock constructor
  }
}