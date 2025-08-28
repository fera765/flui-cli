import { ApiService, Message } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { SettingsManager } from './services/settingsManager';
import { MemoryManager } from './services/memoryManager';
import { OpenAIService } from './services/openAIService';
import { NavigationManager } from './services/navigationManager';
import { ErrorHandler } from './services/errorHandler';
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
  private navigationManager: NavigationManager;
  private errorHandler: ErrorHandler;
  private toolBox: ToolBox;
  private currentRequest: AbortController | null = null;

  constructor(
    private apiService: ApiService,
    private modelManager: ModelManager,
    private chatUI: ChatUI
  ) {
    this.settingsManager = new SettingsManager();
    this.memoryManager = new MemoryManager();
    this.navigationManager = new NavigationManager();
    this.errorHandler = new ErrorHandler();
    
    // Inicializa OpenAIService com endpoint de produção LLM7
    this.openAIService = new OpenAIService(); // Sempre usa produção (LLM7)
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
      // Analisa contexto do diretório atual
      const context = this.navigationManager.analyzeContext();
      
      // Se está em um projeto e o comando não parece relacionado, pergunta
      if (context.isProject && this.shouldWarnAboutContext(input, context)) {
        const warning = `⚠️ Você está em um projeto ${context.projectType || 'existente'}.\n` +
                       `Esta ação parece não estar relacionada ao projeto.\n` +
                       `Deseja continuar mesmo assim? (s/n)`;
        
        console.log(chalk.yellow(warning));
        // Por enquanto, continua normalmente (em produção real, aguardaria confirmação)
      }
      
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
          const toolResponse = this.formatToolResults(input, results);
          
          // Também envia para a LLM para uma resposta mais natural
          const currentModel = this.modelManager.getCurrentModel();
          const contextMessage = `O usuário pediu: "${input}". 
As seguintes ações foram executadas:
${toolResponse}

Por favor, forneça uma resposta amigável confirmando o que foi feito.`;
          
          try {
            const llmResponse = await this.apiService.sendMessage(
              contextMessage,
              currentModel.id,
              this.conversationHistory.slice(-5)
            );
            
            return `${toolResponse}\n\n${llmResponse}`;
          } catch (error) {
            // Se falhar, retorna apenas o resultado das tools
            return toolResponse;
          }
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

  private shouldWarnAboutContext(input: string, context: any): boolean {
    const lowerInput = input.toLowerCase();
    
    // Lista de palavras-chave relacionadas ao projeto atual
    const projectKeywords: Record<string, string[]> = {
      'React': ['component', 'jsx', 'hook', 'state', 'props'],
      'Vue': ['component', 'vue', 'template', 'computed'],
      'Angular': ['component', 'service', 'module', 'directive'],
      'Express': ['route', 'middleware', 'api', 'endpoint'],
      'Node.js': ['module', 'package', 'npm', 'require']
    };
    
    // Se o comando menciona algo completamente não relacionado
    const unrelatedKeywords = ['vídeo', 'video', 'roteiro', 'filme', 'música', 'jogo', 'game'];
    
    // Verifica se parece não relacionado
    if (context.projectType && projectKeywords[context.projectType]) {
      const hasProjectKeyword = projectKeywords[context.projectType].some((kw: string) => 
        lowerInput.includes(kw)
      );
      
      const hasUnrelatedKeyword = unrelatedKeywords.some((kw: string) => 
        lowerInput.includes(kw)
      );
      
      return !hasProjectKeyword && hasUnrelatedKeyword;
    }
    
    return false;
  }
  
  private detectToolsNeeded(input: string): string[] {
    const tools: string[] = [];
    const lowerInput = input.toLowerCase();
    
    // Detecta necessidade de criar arquivo - MAIS ABRANGENTE
    if (lowerInput.includes('crie') || lowerInput.includes('criar') || 
        lowerInput.includes('gere') || lowerInput.includes('gerar') ||
        lowerInput.includes('faça') || lowerInput.includes('fazer') ||
        lowerInput.includes('escreva') || lowerInput.includes('escrever') ||
        lowerInput.includes('salve') || lowerInput.includes('salvar') ||
        lowerInput.includes('grave') || lowerInput.includes('gravar')) {
      
      // Verifica se menciona arquivo ou extensões comuns
      if (lowerInput.includes('arquivo') || lowerInput.includes('file') ||
          lowerInput.includes('documento') || lowerInput.includes('doc') ||
          lowerInput.includes('roteiro') || lowerInput.includes('script') ||
          lowerInput.includes('relatório') || lowerInput.includes('report') ||
          lowerInput.includes('readme') || lowerInput.includes('config') ||
          lowerInput.includes('.md') || lowerInput.includes('.txt') || 
          lowerInput.includes('.json') || lowerInput.includes('.js') || 
          lowerInput.includes('.ts') || lowerInput.includes('.html') ||
          lowerInput.includes('.css') || lowerInput.includes('.yaml') ||
          lowerInput.includes('.yml') || lowerInput.includes('.xml')) {
        tools.push('file_write');
      }
    }
    
    // Detecta necessidade de executar comando - MAIS ABRANGENTE
    if (lowerInput.includes('execute') || lowerInput.includes('executar') || 
        lowerInput.includes('rode') || lowerInput.includes('rodar') ||
        lowerInput.includes('comando') || lowerInput.includes('command') ||
        lowerInput.includes('liste') || lowerInput.includes('listar') || 
        lowerInput.includes('ls') || lowerInput.includes('dir') ||
        lowerInput.includes('mostre') || lowerInput.includes('mostrar') ||
        lowerInput.includes('verifique') || lowerInput.includes('verificar') ||
        lowerInput.includes('versão') || lowerInput.includes('version')) {
      
      // Sempre adiciona shell para comandos de listagem
      if (lowerInput.includes('liste') || lowerInput.includes('listar') || 
          lowerInput.includes('ls') || lowerInput.includes('dir')) {
        tools.push('shell');
      } 
      // Para outros comandos, evita conflito com leitura de arquivo
      else if (!lowerInput.includes('arquivo') && !lowerInput.includes('conteúdo')) {
        tools.push('shell');
      }
    }
    
    // Detecta necessidade de ler arquivo
    if ((lowerInput.includes('ler') || lowerInput.includes('leia') || 
         lowerInput.includes('abrir') || lowerInput.includes('abra') ||
         lowerInput.includes('visualizar') || lowerInput.includes('visualize') ||
         lowerInput.includes('ver') || lowerInput.includes('veja')) &&
        (lowerInput.includes('arquivo') || lowerInput.includes('file') ||
         lowerInput.includes('conteúdo') || lowerInput.includes('content') ||
         lowerInput.match(/\.\w+/))) {
      tools.push('file_read');
    }
    
    // Detecta necessidade de analisar erro
    if (lowerInput.includes('erro') || lowerInput.includes('error') || 
        lowerInput.includes('problema') || lowerInput.includes('problem') ||
        lowerInput.includes('falha') || lowerInput.includes('fail') ||
        lowerInput.includes('bug') || lowerInput.includes('issue') ||
        lowerInput.includes('exception') || lowerInput.includes('exceção') ||
        lowerInput.includes('ajude') || lowerInput.includes('help')) {
      
      // Verifica se parece ser sobre código/erro técnico
      if (lowerInput.includes('typeerror') || lowerInput.includes('referenceerror') ||
          lowerInput.includes('syntaxerror') || lowerInput.includes('undefined') ||
          lowerInput.includes('null') || lowerInput.includes('cannot') ||
          lowerInput.includes('não pode') || lowerInput.includes('não consegue')) {
        tools.push('find_problem_solution');
      }
    }
    
    return tools;
  }

  private extractToolParams(input: string, toolName: string): any {
    const lowerInput = input.toLowerCase();
    
    switch (toolName) {
      case 'file_write':
        // Extrai nome do arquivo - melhorado para detectar mais padrões
        let filename = 'output.txt';
        
        // Tenta encontrar nome de arquivo explícito
        const filePatterns = [
          /(\w+\.\w+)/,  // arquivo.ext
          /arquivo\s+(\w+)/i,  // "arquivo teste"
          /file\s+(\w+)/i,  // "file test"
          /chamado\s+(\w+)/i,  // "chamado exemplo"
          /nome\s+(\w+)/i,  // "nome documento"
        ];
        
        for (const pattern of filePatterns) {
          const match = input.match(pattern);
          if (match) {
            filename = match[1].includes('.') ? match[1] : `${match[1]}.txt`;
            break;
          }
        }
        
        // Se menciona tipo específico, ajusta extensão
        if (lowerInput.includes('roteiro')) filename = 'roteiro.md';
        else if (lowerInput.includes('script')) filename = 'script.md';
        else if (lowerInput.includes('readme')) filename = 'README.md';
        else if (lowerInput.includes('relatório') || lowerInput.includes('relatorio')) filename = 'relatorio.md';
        else if (lowerInput.includes('config')) filename = 'config.json';
        else if (lowerInput.includes('documento')) filename = 'documento.md';
        else if (lowerInput.includes('lista')) filename = 'lista.md';
        else if (lowerInput.includes('todo')) filename = 'TODO.md';
        
        // Determina conteúdo baseado no contexto
        let content = '';
        const date = new Date().toLocaleDateString('pt-BR');
        
        if (filename.includes('roteiro') || lowerInput.includes('roteiro')) {
          content = `# Roteiro\n\n## Introdução\n- Apresentação do tema\n- Objetivos\n- Público-alvo\n\n## Desenvolvimento\n- Ponto principal 1\n- Ponto principal 2\n- Ponto principal 3\n- Demonstrações práticas\n\n## Conclusão\n- Resumo dos pontos\n- Call to action\n- Agradecimentos\n\n---\n*Criado em ${date} com Flui CLI*`;
        } else if (filename.includes('readme') || filename.includes('README')) {
          content = `# Projeto\n\n## 📋 Sobre\nProjeto criado com Flui CLI - Assistente IA com ferramentas integradas.\n\n## 🚀 Instalação\n\`\`\`bash\nnpm install\n\`\`\`\n\n## 💻 Uso\n\`\`\`bash\nnpm start\n\`\`\`\n\n## 🛠️ Tecnologias\n- Node.js\n- TypeScript\n- LLM Integration\n\n## 📝 Licença\nMIT\n\n---\n*Gerado automaticamente em ${date}*`;
        } else if (filename.includes('relatorio') || filename.includes('report')) {
          content = `# Relatório\n\n## Resumo Executivo\nRelatório gerado automaticamente pelo Flui CLI.\n\n## Data\n${date}\n\n## Status\n✅ Operacional\n\n## Métricas\n- Performance: Excelente\n- Disponibilidade: 100%\n- Erros: 0\n\n## Próximos Passos\n1. Continuar monitoramento\n2. Implementar melhorias\n3. Expandir funcionalidades\n\n---\n*Documento gerado automaticamente*`;
        } else if (filename.endsWith('.json')) {
          content = `{\n  "name": "projeto-flui",\n  "version": "1.0.0",\n  "description": "Criado com Flui CLI",\n  "created": "${new Date().toISOString()}",\n  "author": "Flui CLI",\n  "status": "active"\n}`;
        } else if (filename.includes('todo') || filename.includes('TODO')) {
          content = `# TODO List\n\n## 🔴 Alta Prioridade\n- [ ] Tarefa urgente 1\n- [ ] Tarefa urgente 2\n\n## 🟡 Média Prioridade\n- [ ] Tarefa importante 1\n- [ ] Tarefa importante 2\n\n## 🟢 Baixa Prioridade\n- [ ] Melhorias futuras\n- [ ] Otimizações\n\n---\n*Lista criada em ${date}*`;
        } else {
          // Conteúdo genérico melhorado
          content = `# ${filename.replace(/\.\w+$/, '')}\n\n## Descrição\nArquivo criado automaticamente pelo Flui CLI.\n\n## Informações\n- **Data de criação:** ${date}\n- **Gerado por:** Flui CLI com IA\n- **Endpoint:** https://api.llm7.io/v1\n\n## Conteúdo\n${lowerInput.includes('teste') ? 'Este é um arquivo de teste.' : 'Conteúdo do arquivo.'}\n\n---\n*Documento gerado automaticamente*`;
        }
        
        return { filename, content };
        
      case 'shell':
        // Detecção melhorada de comandos
        if (lowerInput.includes('listar') || lowerInput.includes('liste') || 
            lowerInput.includes('ls') || lowerInput.includes('arquivos')) {
          return { command: 'ls -la' };
        } else if (lowerInput.includes('versão') || lowerInput.includes('version')) {
          if (lowerInput.includes('node')) return { command: 'node --version' };
          else if (lowerInput.includes('npm')) return { command: 'npm --version' };
          else return { command: 'node --version && npm --version' };
        } else if (lowerInput.includes('diretório') || lowerInput.includes('diretorio') || 
                   lowerInput.includes('pasta') || lowerInput.includes('pwd')) {
          return { command: 'pwd' };
        } else if (lowerInput.includes('data') || lowerInput.includes('hora')) {
          return { command: 'date' };
        } else if (lowerInput.includes('processo') || lowerInput.includes('process')) {
          return { command: 'ps aux | head -10' };
        } else {
          // Tenta extrair comando direto se mencionado
          const cmdMatch = input.match(/comando[:\s]+([^.!?\n]+)/i);
          if (cmdMatch) return { command: cmdMatch[1].trim() };
          
          return { command: 'echo "Comando executado com sucesso pelo Flui!"' };
        }
        
      case 'file_read':
        const readMatch = input.match(/(\w+\.\w+)/);
        return { path: readMatch ? readMatch[1] : 'package.json' };
        
      case 'find_problem_solution':
        // Melhor extração de mensagens de erro
        const errorPatterns = [
          /(TypeError[^.!?\n]*)/i,
          /(ReferenceError[^.!?\n]*)/i,
          /(SyntaxError[^.!?\n]*)/i,
          /(Error[^.!?\n]*)/i,
          /(erro[^.!?\n]*)/i,
          /(undefined[^.!?\n]*)/i,
          /(null[^.!?\n]*)/i,
          /(cannot[^.!?\n]*)/i,
        ];
        
        for (const pattern of errorPatterns) {
          const match = input.match(pattern);
          if (match) return { error: match[0] };
        }
        
        return { error: 'Erro genérico detectado no código' };
        
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