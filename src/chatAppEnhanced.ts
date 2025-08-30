import { ApiService, Message } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { SettingsManager } from './services/settingsManager';
import { MemoryManager } from './services/memoryManager';
import { ToolsManager, ToolExecutionResult } from './services/toolsManager';
import { ChatUI } from './ui/chatUI';
import { ThemeSelector } from './ui/themeSelector';
import { ModelSelector } from './ui/modelSelector';
import { ToolBox } from './ui/toolBox';

interface ToolCall {
  name: string;
  params: any;
}

export class ChatAppEnhanced {
  private conversationHistory: Message[] = [];
  private isRunning: boolean = false;
  private settingsManager: SettingsManager;
  private themeSelector: ThemeSelector;
  private modelSelector: ModelSelector;
  private memoryManager: MemoryManager;
  private toolsManager: ToolsManager;
  private toolBox: ToolBox;
  private currentRequest: AbortController | null = null;

  constructor(
    private apiService: ApiService,
    private modelManager: ModelManager,
    private chatUI: ChatUI
  ) {
    this.settingsManager = new SettingsManager();
    this.memoryManager = new MemoryManager();
    this.toolsManager = new ToolsManager(this.memoryManager, this.apiService);
    this.toolBox = new ToolBox(this.chatUI.getThemeManager());
    
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
        return shouldContinue;
      }

      // Store user message in memory
      this.memoryManager.addToPrimary({
        id: `user-${Date.now()}`,
        timestamp: new Date(),
        type: 'user_message',
        content: input
      });

      // Display user message
      this.chatUI.displayMessage(input, 'user');
      this.conversationHistory.push({ role: 'user', content: input });

      // Get enhanced response with tools
      const response = await this.getEnhancedResponse(input);
      
      // Store assistant response in memory
      this.memoryManager.addToPrimary({
        id: `assistant-${Date.now()}`,
        timestamp: new Date(),
        type: 'agent_response',
        content: response
      });

      // Display response
      this.chatUI.displayMessage(response, 'assistant');
      this.conversationHistory.push({ role: 'assistant', content: response });

      return true;
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        // Request was aborted, already handled
        return true;
      }
      
      this.chatUI.displayError(`Erro: ${error}`);
      return true;
    }
  }

  private async getEnhancedResponse(input: string): Promise<string> {
    // Show thinking indicator
    this.chatUI.showThinking();

    try {
      // First, send to LLM with tool instructions
      const systemPrompt = `You are Flui, an advanced AI assistant with access to various tools.
You can use the following tools when needed:
- agent([messages]): Delegate tasks to specialized agents
- shell(command): Execute shell commands safely
- file_read(path): Read file contents
- file_replace(path, search, replace): Replace text in files
- find_problem_solution(error): Analyze errors and provide solutions
- secondary_context(name, content): Create/update secondary context
- secondary_context_read(name): Read secondary context

When you need to use a tool, respond with: TOOL:toolname(params)
You can chain multiple tools if needed.
Always validate results and provide a comprehensive final response.`;

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...this.conversationHistory.slice(-10), // Last 10 messages for context
        { role: 'user' as const, content: input }
      ];

      // Get initial response
      let response = await this.apiService.sendMessage(
        input,
        this.modelManager.getCurrentModel().id,
        messages.slice(0, -1)
      );

      // Check for tool calls
      const toolCalls = this.extractToolCalls(response);
      
      if (toolCalls.length > 0) {
        // Execute tools and get results
        const toolResults = await this.executeTools(toolCalls);
        
        // Get final response incorporating tool results
        const finalPrompt = `Based on the following tool execution results, provide a comprehensive response:
${JSON.stringify(toolResults, null, 2)}

Original request: ${input}`;

        response = await this.apiService.sendMessage(
          finalPrompt,
          this.modelManager.getCurrentModel().id,
          [...messages, { role: 'assistant' as const, content: response }]
        );
      }

      return response;
    } finally {
      this.chatUI.hideThinking();
    }
  }

  private extractToolCalls(response: string): ToolCall[] {
    const toolCalls: ToolCall[] = [];
    const toolPattern = /TOOL:(\w+)\((.*?)\)/g;
    
    let match;
    while ((match = toolPattern.exec(response)) !== null) {
      try {
        const name = match[1];
        const params = match[2] ? JSON.parse(match[2]) : undefined;
        toolCalls.push({ name, params });
      } catch (e) {
        // Invalid tool call format, skip
      }
    }
    
    return toolCalls;
  }

  private async executeTools(toolCalls: ToolCall[]): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];
    
    for (const call of toolCalls) {
      // Display tool execution in timeline
      const liveDisplay = this.toolBox.createLiveDisplay(call.name, this.getToolDescription(call));
      
      try {
        let result: ToolExecutionResult;
        
        switch (call.name) {
          case 'agent':
            console.log(liveDisplay.update('running'));
            result = await this.toolsManager.executeAgent(call.params);
            break;
            
          case 'shell':
            console.log(liveDisplay.update('running'));
            result = await this.toolsManager.executeShell(call.params);
            break;
            
          case 'file_read':
            console.log(liveDisplay.update('running'));
            result = await this.toolsManager.fileRead(call.params);
            break;
            
          case 'file_replace':
            console.log(liveDisplay.update('running'));
            result = await this.toolsManager.fileReplace(
              call.params.path,
              call.params.search,
              call.params.replace
            );
            break;
            
          case 'find_problem_solution':
            console.log(liveDisplay.update('running'));
            result = await this.toolsManager.findProblemSolution(call.params);
            break;
            
          case 'secondary_context':
            console.log(liveDisplay.update('running'));
            result = await this.toolsManager.secondaryContext(call.params);
            break;
            
          case 'secondary_context_read':
            console.log(liveDisplay.update('running'));
            result = await this.toolsManager.secondaryContextRead(call.params);
            break;
            
          default:
            result = {
              toolName: call.name,
              status: 'error',
              error: `Unknown tool: ${call.name}`,
              timestamp: new Date()
            };
        }
        
        // Update display with final status
        const finalStatus = result.status === 'success' ? 'success' : 'error';
        console.log(liveDisplay.update(finalStatus, result.displayLogs));
        liveDisplay.stop();
        
        results.push(result);
      } catch (error) {
        liveDisplay.stop();
        results.push({
          toolName: call.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }
    
    return results;
  }

  private getToolDescription(call: ToolCall): string {
    if (call.params) {
      if (typeof call.params === 'string') {
        return call.params.substring(0, 50) + (call.params.length > 50 ? '...' : '');
      }
      if (call.params.command) {
        return call.params.command;
      }
      if (call.params.name) {
        return call.params.name;
      }
    }
    return 'Processing...';
  }

  private async handleCommand(command: string): Promise<boolean> {
    const [cmd, ...args] = command.slice(1).split(' ');

    switch (cmd.toLowerCase()) {
      case 'exit':
      case 'quit':
      case 'sair':
        console.log(this.chatUI.getThemeManager().formatPrimary('\n👋 Até logo! Obrigado por usar o Flui CLI!\n'));
        return false;

      case 'clear':
      case 'limpar':
        console.clear();
        this.conversationHistory = [];
        this.memoryManager.clearPrimary();
        this.chatUI.displayMessage('💫 Conversa limpa!', 'system');
        return true;

      case 'theme':
      case 'tema':
        await this.themeSelector.selectTheme();
        return true;

      case 'model':
      case 'modelo':
        await this.modelSelector.selectModel();
        return true;

      case 'memory':
        const stats = this.memoryManager.getStatistics();
        this.chatUI.displayMessage(`📊 Memory Statistics:
Primary: ${stats.primaryCount} entries (${(stats.primarySize / 1024).toFixed(2)} KB)
Secondary: ${stats.secondaryCount} contexts (${(stats.secondarySize / 1024).toFixed(2)} KB)
Total: ${(stats.totalSize / 1024).toFixed(2)} KB`, 'system');
        return true;

      case 'tools':
        const history = this.toolsManager.getExecutionHistory();
        this.chatUI.displayMessage(`🛠️ Tool Execution History:
${history.slice(-5).map(h => 
  `${h.toolName}: ${h.status} (${h.duration ? h.duration + 'ms' : 'N/A'})`
).join('\n')}`, 'system');
        return true;

      case 'help':
      case 'ajuda':
        this.chatUI.displayMessage(`
🔧 Comandos disponíveis:
  /theme [nome] - Mudar tema
  /model [num] - Mudar modelo
  /memory - Ver estatísticas de memória
  /tools - Ver histórico de ferramentas
  /clear - Limpar conversa
  /exit - Sair`, 'system');
        return true;

      default:
        this.chatUI.displayMessage(`❌ Comando desconhecido: ${cmd}`, 'system');
        return true;
    }
  }

  async run(): Promise<void> {
    await this.initialize();
    this.isRunning = true;

    while (this.isRunning) {
      const shouldContinue = await this.processInput();
      if (!shouldContinue) {
        this.isRunning = false;
      }
    }
  }
}