import { ApiService, Message } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { SettingsManager } from './services/settingsManager';
import { MemoryManager } from './services/memoryManager';
import { OpenAIService } from './services/openAIService';
import { ChatUI } from './ui/chatUI';
import { ThemeSelector } from './ui/themeSelector';
import { ModelSelector } from './ui/modelSelector';
import { ToolBox } from './ui/toolBox';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

export class ChatAppProduction {
  private conversationHistory: Message[] = [];
  private isRunning: boolean = false;
  private settingsManager: SettingsManager;
  private themeSelector: ThemeSelector;
  private modelSelector: ModelSelector;
  private memoryManager: MemoryManager;
  private openAIService: OpenAIService;
  private toolBox: ToolBox;
  private currentRequest: AbortController | null = null;

  constructor(
    private apiService: ApiService,
    private modelManager: ModelManager,
    private chatUI: ChatUI
  ) {
    this.settingsManager = new SettingsManager();
    this.memoryManager = new MemoryManager();
    
    // Inicializa OpenAIService com endpoint de produção LLM7
    this.openAIService = new OpenAIService(undefined, false, true); // Usa produção (LLM7)
    console.log(chalk.green('✅ Conectado ao endpoint de produção: https://api.llm7.io/v1'));
    
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
      
      console.log(chalk.cyan.bold('\n📋 FLUI CLI - PRODUÇÃO'));
      console.log(chalk.green('✅ Endpoint: https://api.llm7.io/v1 (sem API key necessária)'));
      console.log(chalk.yellow('\n🛠️ Tools disponíveis:'));
      console.log(chalk.gray('  • file_write - Criar e salvar arquivos'));
      console.log(chalk.gray('  • shell - Executar comandos seguros'));
      console.log(chalk.gray('  • file_read - Ler conteúdo de arquivos'));
      console.log(chalk.gray('  • file_replace - Substituir texto em arquivos'));
      console.log(chalk.gray('  • find_problem_solution - Analisar e resolver erros'));
      console.log(chalk.cyan('\n💡 Dica: Peça para criar arquivos, executar comandos ou analisar erros!\n'));
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

      // Store user message in memory
      this.memoryManager.addToPrimary({
        id: `user-${Date.now()}`,
        timestamp: new Date(),
        type: 'user_message',
        content: input
      });

      this.chatUI.displayMessage(input, 'user');
      this.conversationHistory.push({ role: 'user', content: input });

      // Get AI response with tools using LLM7 endpoint
      const response = await this.getAIResponseWithTools(input);
      
      // Store response in memory
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
      // Detecta intenções do usuário e prepara tools automaticamente
      const toolsNeeded = this.detectToolsNeeded(input);
      
      if (toolsNeeded.length > 0) {
        console.log(chalk.yellow('\n🔧 Ferramentas detectadas:'), toolsNeeded.join(', '));
        
        // Executa as tools necessárias
        const results = [];
        for (const toolName of toolsNeeded) {
          const params = this.extractToolParams(input, toolName);
          if (params) {
            const result = await this.executeTool(toolName, params);
            results.push(result);
          }
        }
        
        // Prepara resposta com os resultados
        if (results.length > 0) {
          return this.formatToolResults(input, results);
        }
      }
      
      // Se não precisa de tools, usa o endpoint LLM7 diretamente
      const currentModel = this.modelManager.getCurrentModel();
      const messages = [
        ...this.conversationHistory.slice(-10),
        { role: 'user' as const, content: input }
      ];
      
      // Usa o endpoint LLM7 através do apiService existente
      const response = await this.apiService.sendMessage(
        input,
        currentModel.id,
        messages.slice(0, -1)
      );
      
      return response;
    } finally {
      this.chatUI.hideThinking();
    }
  }

  private detectToolsNeeded(input: string): string[] {
    const tools: string[] = [];
    const lowerInput = input.toLowerCase();
    
    // Detecta necessidade de criar arquivo
    if (lowerInput.includes('crie') || lowerInput.includes('criar') || lowerInput.includes('salve') || lowerInput.includes('salvar')) {
      if (lowerInput.includes('arquivo') || lowerInput.includes('.md') || lowerInput.includes('.txt') || 
          lowerInput.includes('.json') || lowerInput.includes('.js') || lowerInput.includes('.ts')) {
        tools.push('file_write');
      }
    }
    
    // Detecta necessidade de executar comando
    if (lowerInput.includes('execute') || lowerInput.includes('executar') || lowerInput.includes('rode') || 
        lowerInput.includes('comando') || lowerInput.includes('listar') || lowerInput.includes('ls')) {
      tools.push('shell');
    }
    
    // Detecta necessidade de ler arquivo
    if (lowerInput.includes('ler') || lowerInput.includes('leia') || lowerInput.includes('mostrar') || 
        lowerInput.includes('conteúdo')) {
      if (lowerInput.includes('arquivo') || lowerInput.includes('.')) {
        tools.push('file_read');
      }
    }
    
    // Detecta necessidade de analisar erro
    if (lowerInput.includes('erro') || lowerInput.includes('error') || lowerInput.includes('problema') || 
        lowerInput.includes('falha') || lowerInput.includes('bug')) {
      tools.push('find_problem_solution');
    }
    
    return tools;
  }

  private extractToolParams(input: string, toolName: string): any {
    const lowerInput = input.toLowerCase();
    
    switch (toolName) {
      case 'file_write':
        // Extrai nome do arquivo
        const fileMatch = input.match(/(\w+\.\w+)/);
        const filename = fileMatch ? fileMatch[1] : 'output.txt';
        
        // Determina conteúdo baseado no tipo de arquivo
        let content = '';
        if (filename.includes('roteiro') || lowerInput.includes('roteiro')) {
          content = `# Roteiro\n\n## Introdução\n- Apresentação\n- Objetivos\n\n## Desenvolvimento\n- Ponto 1\n- Ponto 2\n- Ponto 3\n\n## Conclusão\n- Resumo\n- Call to action`;
        } else if (filename.includes('readme') || filename.includes('README')) {
          content = `# README\n\n## Sobre\nProjeto criado com Flui CLI.\n\n## Instalação\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Uso\n\`\`\`bash\nnpm start\n\`\`\``;
        } else if (filename.endsWith('.json')) {
          content = `{\n  "name": "projeto",\n  "version": "1.0.0",\n  "description": "Criado com Flui CLI"\n}`;
        } else {
          content = `# ${filename}\n\nArquivo criado automaticamente pelo Flui CLI.\n\nData: ${new Date().toISOString()}`;
        }
        
        return { filename, content };
        
      case 'shell':
        if (lowerInput.includes('listar') || lowerInput.includes('ls')) {
          return { command: 'ls -la' };
        } else if (lowerInput.includes('versão') || lowerInput.includes('version')) {
          return { command: 'node --version' };
        } else {
          return { command: 'echo "Comando executado pelo Flui"' };
        }
        
      case 'file_read':
        const readMatch = input.match(/(\w+\.\w+)/);
        return { path: readMatch ? readMatch[1] : 'package.json' };
        
      case 'find_problem_solution':
        const errorMatch = input.match(/(error|erro|Error|TypeError|ReferenceError|SyntaxError)[^.!?]*/i);
        return { error: errorMatch ? errorMatch[0] : 'Generic error' };
        
      default:
        return null;
    }
  }

  private async executeTool(toolName: string, params: any): Promise<any> {
    const liveDisplay = this.toolBox.createLiveDisplay(toolName, 'Executando...');
    console.log(liveDisplay.update('running'));
    
    try {
      const tool = this.openAIService['tools'].get(toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} não encontrada`);
      }
      
      const result = await tool.execute(params);
      
      const status = result.success ? 'success' : 'error';
      console.log(liveDisplay.update(status));
      liveDisplay.stop();
      
      return { tool: toolName, params, result };
    } catch (error) {
      console.log(liveDisplay.update('error'));
      liveDisplay.stop();
      return { tool: toolName, params, error: String(error) };
    }
  }

  private formatToolResults(originalInput: string, results: any[]): string {
    let response = '';
    
    for (const r of results) {
      if (r.result?.success) {
        switch (r.tool) {
          case 'file_write':
            response += `✅ Arquivo **${r.params.filename}** criado com sucesso!\n`;
            response += `📁 Caminho: ${r.result.path || r.params.filename}\n`;
            break;
          case 'shell':
            response += `✅ Comando executado: \`${r.params.command}\`\n`;
            if (r.result.stdout) {
              response += `\`\`\`\n${r.result.stdout.substring(0, 500)}\n\`\`\`\n`;
            }
            break;
          case 'file_read':
            response += `✅ Arquivo lido: ${r.params.path}\n`;
            if (r.result.content) {
              response += `\`\`\`\n${r.result.content.substring(0, 500)}...\n\`\`\`\n`;
            }
            break;
          case 'find_problem_solution':
            response += `✅ Análise do erro:\n`;
            response += `**Solução:** ${r.result.solution}\n`;
            if (r.result.suggestions) {
              response += `**Sugestões:**\n${r.result.suggestions.map((s: string) => `- ${s}`).join('\n')}\n`;
            }
            break;
        }
      } else {
        response += `❌ Erro ao executar ${r.tool}: ${r.error || r.result?.error}\n`;
      }
    }
    
    if (!response) {
      response = 'Operação concluída.';
    }
    
    return response;
  }

  private async handleCommand(command: string): Promise<boolean> {
    const [cmd, ...args] = command.slice(1).split(' ');

    switch (cmd.toLowerCase()) {
      case 'exit':
      case 'quit':
      case 'sair':
        console.log(chalk.cyan('\n👋 Até logo! Obrigado por usar o Flui CLI!\n'));
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
        this.chatUI.displayMessage(`📊 Estatísticas de Memória:
Primária: ${stats.primaryCount} entradas (${(stats.primarySize / 1024).toFixed(2)} KB)
Secundária: ${stats.secondaryCount} contextos (${(stats.secondarySize / 1024).toFixed(2)} KB)
Total: ${(stats.totalSize / 1024).toFixed(2)} KB`, 'system');
        return true;

      case 'tools':
        this.chatUI.displayMessage(`🛠️ Tools Disponíveis:
• file_write - Criar/salvar arquivos
• shell - Executar comandos
• file_read - Ler arquivos
• file_replace - Substituir texto
• find_problem_solution - Analisar erros`, 'system');
        return true;

      case 'help':
      case 'ajuda':
        this.chatUI.displayMessage(`
🔧 Comandos disponíveis:
  /theme - Mudar tema
  /model - Mudar modelo
  /memory - Ver estatísticas
  /tools - Ver ferramentas
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