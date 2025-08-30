import { ApiService, Message } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import axios from 'axios';

/**
 * ChatAppEnhanced - Versão melhorada com detecção aprimorada
 * Criação automática de arquivos para ebooks, artigos, código, etc.
 */
export class ChatAppEnhanced {
  private conversationHistory: Message[] = [];
  private isRunning: boolean = false;
  private apiEndpoint: string = 'https://api.llm7.io/v1/chat/completions';

  constructor(
    private apiService: ApiService,
    private modelManager: ModelManager,
    private chatUI: ChatUI
  ) {}

  async initialize(): Promise<void> {
    await this.modelManager.initialize();
    
    console.clear();
    console.log(chalk.cyan.bold('='.repeat(70)));
    console.log(chalk.cyan.bold('  🚀 FLUI CLI - ENHANCED DYNAMIC VERSION'));
    console.log(chalk.green.bold('  💯 100% Dinâmico | 🤖 100% Autônomo'));
    console.log(chalk.yellow.bold('  📝 Criação automática de arquivos ativada'));
    console.log(chalk.cyan.bold('='.repeat(70)));
    console.log('');
    console.log(chalk.gray('Exemplos de uso:'));
    console.log(chalk.gray('  • "Crie um ebook de 16000 palavras sobre monetização no YouTube"'));
    console.log(chalk.gray('  • "Escreva um artigo sobre IA com 5000 palavras"'));
    console.log(chalk.gray('  • "Desenvolva um script Python para análise de dados"'));
    console.log(chalk.gray('  • "Crie um site React com TailwindCSS"'));
    console.log('');
  }

  async processInput(): Promise<boolean> {
    try {
      const input = await this.chatUI.getUserInput();

      if (!input || input.trim() === '') {
        return true;
      }

      // Comandos especiais
      if (input.startsWith('/')) {
        return await this.handleCommand(input);
      }

      this.chatUI.displayMessage(input, 'user');
      this.conversationHistory.push({ role: 'user', content: input });

      // Processa e responde
      const response = await this.processRequest(input);
      
      this.chatUI.displayMessage(response, 'assistant');
      this.conversationHistory.push({ role: 'assistant', content: response });

      return true;
    } catch (error) {
      this.chatUI.displayError(`Erro: ${error}`);
      return true;
    }
  }

  private async processRequest(input: string): Promise<string> {
    this.chatUI.showThinking();
    
    try {
      // Detecta se precisa criar conteúdo longo ou arquivo
      if (this.shouldCreateFile(input)) {
        return await this.createFileWithContent(input);
      }
      
      // Resposta normal via LLM
      return await this.generateResponse(input);
      
    } finally {
      this.chatUI.hideThinking();
    }
  }

  /**
   * Detecção melhorada - baseada em palavras-chave E contexto
   */
  private shouldCreateFile(input: string): boolean {
    const lowerInput = input.toLowerCase();
    
    // Palavras que indicam criação de conteúdo
    const createKeywords = [
      'crie', 'criar', 'escreva', 'escrever', 'gere', 'gerar',
      'desenvolva', 'desenvolver', 'faça', 'fazer', 'produza', 'produzir',
      'elabore', 'elaborar', 'monte', 'montar'
    ];
    
    // Tipos de conteúdo que devem gerar arquivo
    const contentTypes = [
      'ebook', 'e-book', 'livro', 'artigo', 'documento', 'texto',
      'script', 'código', 'programa', 'site', 'aplicação', 'app',
      'relatório', 'manual', 'guia', 'tutorial', 'roteiro',
      'python', 'javascript', 'react', 'html', 'css'
    ];
    
    // Indicadores de quantidade (sugere conteúdo longo)
    const quantityIndicators = [
      'palavras', 'páginas', 'capítulos', 'linhas', 'parágrafos',
      'mil', '000', 'k '
    ];
    
    // Verifica se tem palavra de criação
    const hasCreateWord = createKeywords.some(kw => lowerInput.includes(kw));
    
    // Verifica se menciona tipo de conteúdo
    const hasContentType = contentTypes.some(ct => lowerInput.includes(ct));
    
    // Verifica se menciona quantidade
    const hasQuantity = quantityIndicators.some(qi => lowerInput.includes(qi));
    
    // Decide se deve criar arquivo
    return hasCreateWord && (hasContentType || hasQuantity);
  }

  /**
   * Cria arquivo com conteúdo gerado
   */
  private async createFileWithContent(input: string): Promise<string> {
    console.log(chalk.yellow('\n📝 Iniciando geração de conteúdo...'));
    
    // Extrai requisitos do pedido
    const requirements = this.extractRequirements(input);
    console.log(chalk.blue(`📊 Requisitos detectados:`));
    console.log(chalk.gray(`   Tipo: ${requirements.type}`));
    console.log(chalk.gray(`   Palavras alvo: ${requirements.targetWords}`));
    
    // Gera conteúdo longo
    const content = await this.generateLongContent(input, requirements);
    
    // Determina nome do arquivo
    const filename = this.generateFilename(input, requirements.type);
    const filepath = path.join(process.cwd(), filename);
    
    // Salva arquivo
    await fs.writeFile(filepath, content, 'utf-8');
    
    // Calcula estatísticas
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const charCount = content.length;
    const lineCount = content.split('\n').length;
    
    console.log(chalk.green(`\n✅ Arquivo criado com sucesso!`));
    console.log(chalk.blue(`📄 Nome: ${filename}`));
    console.log(chalk.blue(`📊 Palavras: ${wordCount.toLocaleString()}`));
    console.log(chalk.blue(`📊 Caracteres: ${charCount.toLocaleString()}`));
    console.log(chalk.blue(`📊 Linhas: ${lineCount.toLocaleString()}`));
    
    // Calcula score baseado no objetivo
    let score = 100;
    if (requirements.targetWords > 0) {
      score = Math.min(100, (wordCount / requirements.targetWords) * 100);
    }
    console.log(chalk.yellow(`🎯 Score: ${score.toFixed(1)}%`));
    
    return `✅ **Arquivo criado com sucesso!**

📄 **Nome:** ${filename}
📁 **Local:** ${filepath}

📊 **Estatísticas:**
• Palavras: ${wordCount.toLocaleString()} ${requirements.targetWords > 0 ? `(Objetivo: ${requirements.targetWords.toLocaleString()})` : ''}
• Caracteres: ${charCount.toLocaleString()}
• Linhas: ${lineCount.toLocaleString()}
• Score: ${score.toFixed(1)}%

O conteúdo foi gerado 100% dinamicamente via LLM.`;
  }

  /**
   * Extrai requisitos do pedido
   */
  private extractRequirements(input: string): any {
    const lowerInput = input.toLowerCase();
    
    // Detecta tipo de conteúdo
    let type = 'documento';
    if (lowerInput.includes('ebook') || lowerInput.includes('e-book')) type = 'ebook';
    else if (lowerInput.includes('artigo')) type = 'artigo';
    else if (lowerInput.includes('python')) type = 'python';
    else if (lowerInput.includes('react')) type = 'react';
    else if (lowerInput.includes('javascript') || lowerInput.includes('js')) type = 'javascript';
    else if (lowerInput.includes('roteiro')) type = 'roteiro';
    else if (lowerInput.includes('relatório')) type = 'relatorio';
    
    // Detecta número de palavras desejado
    let targetWords = 0;
    const wordMatches = input.match(/(\d+)\s*(mil|k)?\s*palavras/i);
    if (wordMatches) {
      targetWords = parseInt(wordMatches[1]);
      if (wordMatches[2] && (wordMatches[2].toLowerCase() === 'mil' || wordMatches[2].toLowerCase() === 'k')) {
        targetWords *= 1000;
      }
    }
    
    return { type, targetWords };
  }

  /**
   * Gera conteúdo longo via múltiplas chamadas à LLM
   */
  private async generateLongContent(request: string, requirements: any): Promise<string> {
    let fullContent = '';
    let currentWords = 0;
    let iteration = 0;
    const targetWords = requirements.targetWords || 5000;
    const maxIterations = Math.ceil(targetWords / 1500) + 3;
    
    console.log(chalk.cyan(`\n🔄 Gerando conteúdo (alvo: ${targetWords} palavras)...`));
    
    while (currentWords < targetWords && iteration < maxIterations) {
      iteration++;
      const progress = Math.min(100, (currentWords / targetWords) * 100);
      
      process.stdout.write(`\r   Progresso: ${chalk.yellow(progress.toFixed(1) + '%')} | Palavras: ${chalk.green(currentWords + '/' + targetWords)} | Iteração: ${iteration}`);
      
      try {
        // Prompt adaptativo baseado no progresso
        let prompt = '';
        if (iteration === 1) {
          prompt = `${request}. Gere conteúdo extremamente detalhado e completo. Mínimo de 2000 palavras nesta parte.`;
        } else {
          const remaining = targetWords - currentWords;
          prompt = `Continue expandindo o conteúdo anterior. Adicione mais ${remaining} palavras com novos detalhes, exemplos e informações relevantes. Seja muito específico e detalhado.`;
        }
        
        const response = await axios.post(this.apiEndpoint, {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Você é um especialista em criação de conteúdo. Gere conteúdo extremamente detalhado, específico e de alta qualidade. Cada resposta deve ter pelo menos 1500 palavras.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 4000,
          top_p: 0.95
        }, {
          timeout: 30000
        });
        
        const newContent = response.data.choices[0].message.content;
        fullContent += (iteration === 1 ? '' : '\n\n') + newContent;
        currentWords = fullContent.split(/\s+/).filter(w => w.length > 0).length;
        
        // Pequena pausa entre requisições
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(chalk.red(`\n   Erro na iteração ${iteration}, tentando continuar...`));
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(''); // Nova linha após o progresso
    return fullContent;
  }

  /**
   * Gera nome de arquivo apropriado
   */
  private generateFilename(input: string, type: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    // Extrai tema se possível
    let theme = 'conteudo';
    if (input.toLowerCase().includes('youtube')) theme = 'youtube';
    else if (input.toLowerCase().includes('monetização')) theme = 'monetizacao';
    else if (input.toLowerCase().includes('ia') || input.toLowerCase().includes('inteligência')) theme = 'ia';
    else if (input.toLowerCase().includes('python')) theme = 'python';
    else if (input.toLowerCase().includes('react')) theme = 'react';
    
    // Determina extensão baseada no tipo
    let extension = '.md';
    if (type === 'python') extension = '.py';
    else if (type === 'javascript') extension = '.js';
    else if (type === 'react') extension = '.jsx';
    else if (type === 'html') extension = '.html';
    
    return `${type}-${theme}-${timestamp}${extension}`;
  }

  /**
   * Gera resposta normal (não arquivo)
   */
  private async generateResponse(input: string): Promise<string> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        ...this.conversationHistory.slice(-5).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: input
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });
    
    return response.data.choices[0].message.content;
  }

  private async handleCommand(command: string): Promise<boolean> {
    const cmd = command.slice(1).toLowerCase();
    
    switch (cmd) {
      case 'exit':
      case 'quit':
      case 'sair':
        console.log(chalk.cyan('\n👋 Até logo!\n'));
        return false;
        
      case 'clear':
      case 'limpar':
        console.clear();
        this.conversationHistory = [];
        console.log(chalk.green('💫 Conversa limpa!\n'));
        return true;
        
      case 'help':
      case 'ajuda':
        console.log(chalk.cyan(`
🔧 Comandos disponíveis:
  /clear - Limpar conversa
  /exit - Sair
  /help - Mostrar ajuda

💡 Exemplos de uso:
  • Crie um ebook de 16000 palavras sobre [tema]
  • Escreva um artigo técnico sobre [tema]
  • Desenvolva um script Python para [tarefa]
  • Crie um site React com [especificações]
        `));
        return true;
        
      default:
        console.log(chalk.red(`❌ Comando desconhecido: ${cmd}\n`));
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