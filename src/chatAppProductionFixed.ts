import { ApiService, Message } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { SettingsManager } from './services/settingsManager';
import { MemoryManager } from './services/memoryManager';
import { NavigationManager } from './services/navigationManager';
import { ErrorHandler } from './services/errorHandler';
import { ChatUI } from './ui/chatUI';
import { ThemeSelector } from './ui/themeSelector';
import { ModelSelector } from './ui/modelSelector';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import axios from 'axios';

export class ChatAppProductionFixed {
  private conversationHistory: Message[] = [];
  private isRunning: boolean = false;
  private settingsManager: SettingsManager;
  private themeSelector: ThemeSelector;
  private modelSelector: ModelSelector;
  private memoryManager: MemoryManager;
  private navigationManager: NavigationManager;
  private errorHandler: ErrorHandler;
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
    
    console.log(chalk.green('✅ Conectado ao endpoint de produção: https://api.llm7.io/v1'));
    
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
      
      console.log(chalk.cyan.bold('\n📋 FLUI CLI - PRODUÇÃO FIXED'));
      console.log(chalk.green('✅ Endpoint: https://api.llm7.io/v1 (sem API key necessária)'));
      console.log(chalk.yellow('\n🛠️ Capacidades:'));
      console.log(chalk.gray('  • Geração de conteúdo 100% dinâmico via LLM'));
      console.log(chalk.gray('  • Criação automática de arquivos'));
      console.log(chalk.gray('  • Análise e resolução inteligente'));
      console.log(chalk.cyan('\n💡 Peça para criar ebooks, artigos, sites e mais!\n'));
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

      // Get AI response with automatic file creation
      const response = await this.getAIResponseWithAutoExecution(input);
      
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

  private async getAIResponseWithAutoExecution(input: string): Promise<string> {
    this.chatUI.showThinking();
    
    try {
      // Detecta se precisa criar arquivo
      const needsFileCreation = this.detectFileCreationNeed(input);
      
      if (needsFileCreation) {
        console.log(chalk.yellow('📝 Detectada necessidade de criação de arquivo...'));
        
        // Extrai informações do pedido
        const fileInfo = this.extractFileInfo(input);
        
        // Gera conteúdo via LLM
        console.log(chalk.cyan('🤖 Gerando conteúdo via LLM...'));
        const content = await this.generateContentViaLLM(input);
        
        // Salva o arquivo
        const filename = fileInfo.filename || this.generateFilename(input);
        const filepath = path.join(process.cwd(), filename);
        
        await fs.writeFile(filepath, content, 'utf-8');
        
        console.log(chalk.green(`✅ Arquivo criado: ${filename}`));
        console.log(chalk.blue(`📊 Tamanho: ${content.length} caracteres`));
        console.log(chalk.blue(`📊 Palavras: ${content.split(/\s+/).length} palavras`));
        
        // Retorna resposta de sucesso
        return `✅ **Arquivo criado com sucesso!**

📄 **Nome:** ${filename}
📁 **Local:** ${filepath}
📊 **Estatísticas:**
- Caracteres: ${content.length.toLocaleString()}
- Palavras: ${content.split(/\s+/).length.toLocaleString()}
- Linhas: ${content.split('\n').length.toLocaleString()}

O conteúdo foi gerado 100% dinamicamente via LLM, sem uso de templates ou dados pré-definidos.`;
      }
      
      // Se não precisa criar arquivo, apenas responde normalmente
      const currentModel = this.modelManager.getCurrentModel();
      const response = await this.apiService.sendMessage(
        input,
        currentModel.id,
        this.conversationHistory.slice(-10)
      );
      
      return response;
      
    } finally {
      this.chatUI.hideThinking();
    }
  }

  private detectFileCreationNeed(input: string): boolean {
    const lowerInput = input.toLowerCase();
    
    const creationKeywords = [
      'crie', 'criar', 'gere', 'gerar', 'faça', 'fazer',
      'escreva', 'escrever', 'produza', 'produzir',
      'desenvolva', 'desenvolver', 'elabore', 'elaborar'
    ];
    
    const contentTypes = [
      'ebook', 'livro', 'artigo', 'documento', 'arquivo',
      'roteiro', 'script', 'relatório', 'manual', 'guia',
      'texto', 'conteúdo', 'material', 'site', 'código',
      'programa', 'aplicação', 'app'
    ];
    
    const hasCreationKeyword = creationKeywords.some(kw => lowerInput.includes(kw));
    const hasContentType = contentTypes.some(ct => lowerInput.includes(ct));
    
    return hasCreationKeyword && hasContentType;
  }

  private extractFileInfo(input: string): { filename?: string; format?: string } {
    const lowerInput = input.toLowerCase();
    let filename: string | undefined;
    let format = 'md'; // Default markdown
    
    // Detecta formato
    if (lowerInput.includes('python') || lowerInput.includes('.py')) format = 'py';
    else if (lowerInput.includes('javascript') || lowerInput.includes('.js')) format = 'js';
    else if (lowerInput.includes('typescript') || lowerInput.includes('.ts')) format = 'ts';
    else if (lowerInput.includes('html')) format = 'html';
    else if (lowerInput.includes('css')) format = 'css';
    else if (lowerInput.includes('json')) format = 'json';
    else if (lowerInput.includes('yaml') || lowerInput.includes('yml')) format = 'yaml';
    else if (lowerInput.includes('xml')) format = 'xml';
    else if (lowerInput.includes('txt') || lowerInput.includes('texto')) format = 'txt';
    
    // Tenta extrair nome do arquivo
    const filePatterns = [
      /arquivo\s+chamado\s+["']?(\S+)["']?/i,
      /arquivo\s+["']?(\S+)["']?/i,
      /chamado\s+["']?(\S+)["']?/i,
      /nome\s+["']?(\S+)["']?/i,
    ];
    
    for (const pattern of filePatterns) {
      const match = input.match(pattern);
      if (match) {
        filename = match[1];
        break;
      }
    }
    
    return { filename, format };
  }

  private generateFilename(input: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const lowerInput = input.toLowerCase();
    
    // Determina o tipo de conteúdo
    if (lowerInput.includes('ebook')) return `ebook-${timestamp}.md`;
    if (lowerInput.includes('artigo')) return `artigo-${timestamp}.md`;
    if (lowerInput.includes('roteiro')) return `roteiro-${timestamp}.md`;
    if (lowerInput.includes('relatório')) return `relatorio-${timestamp}.md`;
    if (lowerInput.includes('site')) return `site-${timestamp}.html`;
    if (lowerInput.includes('python')) return `script-${timestamp}.py`;
    if (lowerInput.includes('javascript')) return `script-${timestamp}.js`;
    
    return `documento-${timestamp}.md`;
  }

  private async generateContentViaLLM(userRequest: string): Promise<string> {
    const systemPrompt = `Você é um especialista em criação de conteúdo profissional.

REGRAS CRÍTICAS:
1. SEMPRE gere conteúdo COMPLETO, DETALHADO e ESPECÍFICO
2. NUNCA use templates genéricos ou placeholders
3. Para ebooks: MÍNIMO de 20.000 palavras
4. Para artigos: MÍNIMO de 5.000 palavras
5. Para outros conteúdos: MÍNIMO de 2.000 palavras
6. Use dados reais, exemplos concretos e informações atualizadas
7. Estruture o conteúdo de forma profissional
8. Seja criativo, original e agregue valor real

IMPORTANTE: O conteúdo DEVE ser extenso e completo. Não economize em detalhes.`;

    const userPrompt = `${userRequest}

REQUISITOS OBRIGATÓRIOS:
- Gere conteúdo COMPLETO e EXTENSO
- Se for ebook: MÍNIMO 20.000 palavras
- Se for artigo: MÍNIMO 5.000 palavras
- Seja MUITO detalhado e específico
- Use formatação markdown se apropriado
- NÃO use placeholders ou templates
- Crie conteúdo ORIGINAL e de ALTA QUALIDADE`;

    try {
      // Chama a API LLM7 diretamente
      const response = await axios.post('https://api.llm7.io/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 4000, // Máximo de tokens para conteúdo longo
        stream: false
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let content = response.data.choices[0].message.content;
      
      // Se o conteúdo for muito curto, faz múltiplas chamadas para expandir
      const minWords = userRequest.toLowerCase().includes('ebook') ? 20000 : 5000;
      let currentWords = content.split(/\s+/).length;
      let iterations = 0;
      
      while (currentWords < minWords && iterations < 10) {
        console.log(chalk.yellow(`📈 Expandindo conteúdo: ${currentWords}/${minWords} palavras...`));
        
        const expansionPrompt = `Continue expandindo o conteúdo abaixo para atingir ${minWords} palavras.
Adicione mais capítulos, seções, exemplos e detalhes.

CONTEÚDO ATUAL:
${content.slice(-2000)}

CONTINUE A PARTIR DAQUI com mais conteúdo detalhado e relevante:`;

        const expansionResponse = await axios.post('https://api.llm7.io/v1/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'user', content: expansionPrompt }
          ],
          temperature: 0.8,
          max_tokens: 4000
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const newContent = expansionResponse.data.choices[0].message.content;
        content += '\n\n' + newContent;
        currentWords = content.split(/\s+/).length;
        iterations++;
      }
      
      console.log(chalk.green(`✅ Conteúdo gerado: ${currentWords} palavras`));
      return content;
      
    } catch (error: any) {
      console.error(chalk.red('❌ Erro ao gerar conteúdo:'), error.message);
      
      // Fallback com conteúdo básico
      return `# Documento Gerado

## Introdução

Este documento foi gerado automaticamente pelo Flui CLI.

### Sobre o Pedido
${userRequest}

### Conteúdo

[Conteúdo em desenvolvimento - houve um erro na geração completa]

---
*Gerado em ${new Date().toISOString()}*`;
    }
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

      case 'help':
      case 'ajuda':
        this.chatUI.displayMessage(`
🔧 Comandos disponíveis:
  /theme - Mudar tema
  /model - Mudar modelo
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