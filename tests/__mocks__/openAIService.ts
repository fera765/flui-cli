export class OpenAIService {
  sendMessageWithTools = jest.fn().mockResolvedValue({
    response: 'Test response',
    toolCalls: []
  });
  
  registerTool = jest.fn();
  
  constructor(apiKey?: string) {
    // Mock constructor
  }
}