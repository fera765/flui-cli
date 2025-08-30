import { ApiService, Message } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { SettingsManager } from './services/settingsManager';
import { MemoryManager } from './services/memoryManager';
import { ToolsManager } from './services/toolsManager';
import { ChatUI } from './ui/chatUI';
import { ThemeSelector } from './ui/themeSelector';
import { ModelSelector } from './ui/modelSelector';
import { ToolBox } from './ui/toolBox';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ToolCall {
  name: string;
  params: any;
}

export class ChatAppWithTools {
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
      
      const settings = this.settingsManager.getAllSettings();
      
      if (settings.theme) {
        try {
          this.chatUI.getThemeManager().setTheme(settings.theme);
        } catch (e) {}
      }
      
      if (settings.modelIndex) {
        try {
          this.modelManager.selectModel(settings.modelIndex);
        } catch (e) {}
      }
      
      this.setupEscapeHandler();
      
      this.chatUI.displayDisclaimer();
      this.chatUI.displayWelcome();
      this.chatUI.displayModels(this.modelManager.getFormattedModelList());
      
      console.log('\n📋 Tools disponíveis para o Flui:');
      console.log('  • Criar e salvar arquivos');
      console.log('  • Executar comandos seguros');
      console.log('  • Analisar e resolver erros');
      console.log('  • Delegar tarefas para agentes especializados\n');
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

      if (input.startsWith('/')) {
        const shouldContinue = await this.handleCommand(input);
        return shouldContinue;
      }

      // Store user message
      this.memoryManager.addToPrimary({
        id: `user-${Date.now()}`,
        timestamp: new Date(),
        type: 'user_message',
        content: input
      });

      this.chatUI.displayMessage(input, 'user');
      this.conversationHistory.push({ role: 'user', content: input });

      // Get AI response with tools
      const response = await this.getAIResponseWithTools(input);
      
      // Store response
      this.memoryManager.addToPrimary({
        id: `assistant-${Date.now()}`,
        timestamp: new Date(),
        type: 'agent_response',
        content: response
      });

      this.chatUI.displayMessage(response, 'assistant');
      this.conversationHistory.push({ role: 'assistant', content: response });

      return true;
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        return true;
      }
      
      this.chatUI.displayError(`Erro: ${error}`);
      return true;
    }
  }

  private async getAIResponseWithTools(input: string): Promise<string> {
    this.chatUI.showThinking();

    try {
      // Enhanced system prompt with clear tool usage instructions
      const systemPrompt = `You are Flui, an advanced AI assistant with powerful tools at your disposal.

AVAILABLE TOOLS:
1. file_write(filename, content) - Create or overwrite a file with content
2. shell(command) - Execute shell commands (safe commands only)
3. file_read(path) - Read file contents
4. file_replace(path, search, replace) - Replace text in files
5. find_problem_solution(error) - Analyze errors and provide solutions
6. agent(role, task) - Delegate to specialized agents

TOOL USAGE FORMAT:
When you need to use a tool, include it in your response using this EXACT format:
[TOOL: toolname(param1, param2)]

EXAMPLES:
- To create a file: [TOOL: file_write("example.md", "# Content here")]
- To execute command: [TOOL: shell("ls -la")]
- To read a file: [TOOL: file_read("package.json")]
- To delegate: [TOOL: agent("expert", "analyze this code")]

IMPORTANT RULES:
1. You CAN and SHOULD use tools when the user asks for file creation, command execution, or analysis
2. You can use multiple tools in sequence
3. Always explain what you're doing with the tools
4. When creating files, use the exact filename if specified, otherwise choose an appropriate name
5. For file creation tasks, ALWAYS use file_write tool
6. After using tools, provide a summary of what was accomplished`;

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...this.conversationHistory.slice(-10),
        { role: 'user' as const, content: input }
      ];

      // Get response from LLM
      let response = await this.apiService.sendMessage(
        input,
        this.modelManager.getCurrentModel().id,
        messages.slice(0, -1)
      );

      // Process tool calls in the response
      response = await this.processToolsInResponse(response, input);

      return response;
    } finally {
      this.chatUI.hideThinking();
    }
  }

  private async processToolsInResponse(response: string, originalInput: string): Promise<string> {
    const toolPattern = /\[TOOL:\s*(\w+)\((.*?)\)\]/g;
    const toolCalls: ToolCall[] = [];
    let processedResponse = response;
    
    let match;
    while ((match = toolPattern.exec(response)) !== null) {
      const toolName = match[1];
      const paramsStr = match[2];
      
      try {
        // Parse parameters
        const params = this.parseToolParams(paramsStr);
        toolCalls.push({ name: toolName, params });
      } catch (e) {
        console.error('Error parsing tool params:', e);
      }
    }

    if (toolCalls.length > 0) {
      console.log('\n🛠️ Executando ferramentas...\n');
      
      for (const call of toolCalls) {
        const result = await this.executeTool(call);
        
        // Replace tool call with result in response
        if (result.success) {
          const toolCallStr = `[TOOL: ${call.name}(${this.stringifyParams(call.params)})]`;
          processedResponse = processedResponse.replace(
            toolCallStr,
            `✅ ${call.name} executado com sucesso`
          );
        }
      }
    }

    return processedResponse;
  }

  private parseToolParams(paramsStr: string): any {
    if (!paramsStr || paramsStr.trim() === '') {
      return {};
    }

    // Handle different parameter formats
    const params = paramsStr.split(',').map(p => p.trim());
    
    if (params.length === 1) {
      // Single parameter
      return this.parseValue(params[0]);
    } else if (params.length === 2) {
      // Two parameters (for file operations)
      return {
        param1: this.parseValue(params[0]),
        param2: this.parseValue(params[1])
      };
    } else if (params.length === 3) {
      // Three parameters (for replace)
      return {
        param1: this.parseValue(params[0]),
        param2: this.parseValue(params[1]),
        param3: this.parseValue(params[2])
      };
    }
    
    return params.map(p => this.parseValue(p));
  }

  private parseValue(value: string): any {
    value = value.trim();
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    
    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private stringifyParams(params: any): string {
    if (typeof params === 'string') {
      return `"${params}"`;
    }
    if (Array.isArray(params)) {
      return params.map(p => this.stringifyParams(p)).join(', ');
    }
    if (params.param1) {
      const parts = [this.stringifyParams(params.param1)];
      if (params.param2) parts.push(this.stringifyParams(params.param2));
      if (params.param3) parts.push(this.stringifyParams(params.param3));
      return parts.join(', ');
    }
    return JSON.stringify(params);
  }

  private async executeTool(call: ToolCall): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const liveDisplay = this.toolBox.createLiveDisplay(call.name, 'Executando...');
      console.log(liveDisplay.update('running'));

      let result: any;

      switch (call.name) {
        case 'file_write':
          result = await this.executeFileWrite(call.params);
          break;
          
        case 'shell':
          const command = typeof call.params === 'string' ? call.params : call.params.param1;
          result = await this.toolsManager.executeShell(command);
          break;
          
        case 'file_read':
          const readPath = typeof call.params === 'string' ? call.params : call.params.param1;
          result = await this.toolsManager.fileRead(readPath);
          break;
          
        case 'file_replace':
          result = await this.toolsManager.fileReplace(
            call.params.param1,
            call.params.param2,
            call.params.param3 || call.params.param2
          );
          break;
          
        case 'find_problem_solution':
          const error = typeof call.params === 'string' ? call.params : call.params.param1;
          result = await this.toolsManager.findProblemSolution(error);
          break;
          
        case 'agent':
          const messages = [
            { role: 'system' as const, content: call.params.param1 || 'You are a helpful assistant' },
            { role: 'user' as const, content: call.params.param2 || call.params }
          ];
          result = await this.toolsManager.executeAgent(messages);
          break;
          
        default:
          throw new Error(`Unknown tool: ${call.name}`);
      }

      const status = result.status === 'success' ? 'success' : 'error';
      console.log(liveDisplay.update(status, result.displayLogs));
      liveDisplay.stop();

      return { success: result.status === 'success', result };
    } catch (error) {
      console.error(`Error executing tool ${call.name}:`, error);
      return { success: false, error: String(error) };
    }
  }

  private async executeFileWrite(params: any): Promise<any> {
    try {
      let filename: string;
      let content: string;

      if (typeof params === 'string') {
        // Single string parameter - use as content with default filename
        filename = 'output.txt';
        content = params;
      } else if (params.param1 && params.param2) {
        filename = params.param1;
        content = params.param2;
      } else if (Array.isArray(params) && params.length >= 2) {
        filename = params[0];
        content = params[1];
      } else {
        throw new Error('Invalid parameters for file_write');
      }

      // Ensure safe path
      filename = path.basename(filename);
      const filepath = path.join(process.cwd(), filename);

      await fs.writeFile(filepath, content, 'utf8');

      return {
        status: 'success',
        output: `File "${filename}" created successfully`,
        toolName: 'file_write',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'error',
        error: String(error),
        toolName: 'file_write',
        timestamp: new Date()
      };
    }
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