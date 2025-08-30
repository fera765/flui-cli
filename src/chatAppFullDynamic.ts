import { ApiService, Message } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';
import { LLMContentGeneratorDynamic } from './services/llmContentGeneratorDynamic';
import { DynamicIntentDetector } from './services/dynamicIntentDetector';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import axios from 'axios';

/**
 * ChatAppFullDynamic - 100% DINÂMICO E AUTÔNOMO
 * ZERO templates, ZERO strings fixas, TUDO via LLM
 */
export class ChatAppFullDynamic {
  private conversationHistory: Message[] = [];
  private isRunning: boolean = false;
  private contentGenerator: LLMContentGeneratorDynamic;
  private intentDetector: DynamicIntentDetector;
  private apiEndpoint: string = 'https://api.llm7.io/v1/chat/completions';

  constructor(
    private apiService: ApiService,
    private modelManager: ModelManager,
    private chatUI: ChatUI
  ) {
    this.contentGenerator = new LLMContentGeneratorDynamic();
    this.intentDetector = new DynamicIntentDetector();
  }

  async initialize(): Promise<void> {
    await this.modelManager.initialize();
    
    // Gera mensagem de boas-vindas dinamicamente
    const welcomeMessage = await this.generateDynamicMessage('welcome');
    console.log(chalk.cyan(welcomeMessage));
  }

  /**
   * Gera mensagens dinamicamente via LLM
   */
  private async generateDynamicMessage(type: string, context?: any): Promise<string> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Gere uma mensagem de ${type} para um CLI de IA. Contexto: ${JSON.stringify(context || {})}`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });
    
    return response.data.choices[0].message.content;
  }

  async processInput(): Promise<boolean> {
    try {
      const input = await this.chatUI.getUserInput();

      if (!input || input.trim() === '') {
        return true;
      }

      // Detecta comando dinamicamente
      if (await this.isDynamicCommand(input)) {
        return await this.handleDynamicCommand(input);
      }

      this.chatUI.displayMessage(input, 'user');
      this.conversationHistory.push({ role: 'user', content: input });

      // Processa com IA 100% dinâmica
      const response = await this.processDynamically(input);
      
      this.chatUI.displayMessage(response, 'assistant');
      this.conversationHistory.push({ role: 'assistant', content: response });

      return true;
    } catch (error) {
      // Gera mensagem de erro dinamicamente
      const errorMessage = await this.generateDynamicMessage('error', { error: String(error) });
      this.chatUI.displayError(errorMessage);
      return true;
    }
  }

  /**
   * Verifica se é comando dinamicamente
   */
  private async isDynamicCommand(input: string): Promise<boolean> {
    if (!input.startsWith('/')) return false;
    
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `É este um comando de sistema? Responda apenas "sim" ou "não": ${input}`
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    });
    
    return response.data.choices[0].message.content.toLowerCase().includes('sim');
  }

  /**
   * Processa comandos dinamicamente
   */
  private async handleDynamicCommand(command: string): Promise<boolean> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Processe o comando e retorne a ação apropriada'
        },
        {
          role: 'user',
          content: command
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });
    
    const action = response.data.choices[0].message.content;
    
    // Executa ação baseada na resposta da LLM
    if (action.includes('sair') || action.includes('exit')) {
      return false;
    }
    
    console.log(chalk.cyan(action));
    return true;
  }

  /**
   * Processa entrada 100% dinamicamente
   */
  private async processDynamically(input: string): Promise<string> {
    this.chatUI.showThinking();
    
    try {
      // Detecta intenção dinamicamente
      const intent = await this.intentDetector.detectIntent(input);
      
      // Detecta necessidade de criar arquivo dinamicamente
      if (await this.needsFileCreation(input, intent)) {
        return await this.createFileDynamically(input, intent);
      }
      
      // Gera resposta via LLM
      const response = await this.generateDynamicResponse(input, intent);
      return response;
      
    } finally {
      this.chatUI.hideThinking();
    }
  }

  /**
   * Detecta necessidade de criar arquivo dinamicamente
   */
  private async needsFileCreation(input: string, intent: any): Promise<boolean> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Este pedido requer criação de arquivo? Responda "sim" ou "não": ${input}`
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    });
    
    return response.data.choices[0].message.content.toLowerCase().includes('sim');
  }

  /**
   * Cria arquivo 100% dinamicamente
   */
  private async createFileDynamically(input: string, intent: any): Promise<string> {
    console.log(chalk.yellow('📝 Criando arquivo dinamicamente...'));
    
    // Gera conteúdo via gerador dinâmico
    const content = await this.contentGenerator.generateContent(input);
    
    // Determina nome do arquivo dinamicamente
    const filename = await this.generateDynamicFilename(input, intent);
    const filepath = path.join(process.cwd(), filename);
    
    // Salva arquivo
    await fs.writeFile(filepath, content, 'utf-8');
    
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    
    // Gera resposta de sucesso dinamicamente
    return await this.generateDynamicMessage('file_created', {
      filename,
      filepath,
      wordCount,
      charCount: content.length
    });
  }

  /**
   * Gera nome de arquivo dinamicamente
   */
  private async generateDynamicFilename(input: string, intent: any): Promise<string> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Sugira um nome de arquivo apropriado para: ${input}. Responda APENAS com o nome do arquivo incluindo extensão.`
        }
      ],
      temperature: 0.5,
      max_tokens: 50
    });
    
    const suggestion = response.data.choices[0].message.content.trim();
    
    // Adiciona timestamp para evitar conflitos
    const timestamp = Date.now();
    const base = suggestion.replace(/\.[^.]+$/, '');
    const ext = suggestion.match(/\.[^.]+$/)?.[0] || '.md';
    
    return `${base}-${timestamp}${ext}`;
  }

  /**
   * Gera resposta dinâmica via LLM
   */
  private async generateDynamicResponse(input: string, intent: any): Promise<string> {
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