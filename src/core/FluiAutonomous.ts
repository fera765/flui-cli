import axios from 'axios';
import { DynamicToolSystem } from './DynamicToolSystem';
import chalk from 'chalk';

/**
 * Flui 100% Autônomo e Dinâmico
 * ZERO palavras-chave estáticas - Tudo decidido pela LLM
 */
export class FluiAutonomous {
  private toolSystem: DynamicToolSystem;
  private apiEndpoint = 'https://api.llm7.io/v1/chat/completions';
  private conversationHistory: any[] = [];
  
  constructor() {
    this.toolSystem = new DynamicToolSystem();
  }
  
  /**
   * Processa input do usuário de forma 100% dinâmica
   */
  async processUserInput(input: string): Promise<void> {
    console.log(chalk.cyan('\n🤖 Processando requisição de forma 100% dinâmica...'));
    
    try {
      // Envia para LLM com tools disponíveis para ela decidir o que fazer
      const response = await this.callLLMWithTools(input);
      
      // Processa resposta e executa tools se necessário
      await this.handleLLMResponse(response, input);
      
    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error);
    }
  }
  
  /**
   * Chama LLM com todas as tools disponíveis
   */
  private async callLLMWithTools(input: string): Promise<any> {
    console.log(chalk.blue('📡 Consultando LLM com tools disponíveis...'));
    
    const messages = [
      {
        role: 'system',
        content: `You are an autonomous AI assistant. Analyze the user request and use the appropriate tools to fulfill it. 
        Always aim for the highest quality output. If generating content, ensure it meets or exceeds the requested specifications.`
      },
      ...this.conversationHistory,
      {
        role: 'user',
        content: input
      }
    ];
    
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: messages,
      tools: this.toolSystem.getToolsSchema(),
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 4000
    };
    
    console.log(chalk.gray('🔍 Tools disponíveis para LLM:'));
    this.toolSystem.getToolsSchema().forEach(tool => {
      console.log(chalk.gray(`   • ${tool.function.name}`));
    });
    
    const response = await axios.post(this.apiEndpoint, requestBody);
    return response.data;
  }
  
  /**
   * Processa resposta da LLM e executa tools
   */
  private async handleLLMResponse(response: any, originalInput: string): Promise<void> {
    const message = response.choices[0].message;
    
    // Se a LLM decidiu usar tools
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log(chalk.yellow(`\n🛠️ LLM decidiu usar ${message.tool_calls.length} tool(s):`));
      
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const parameters = JSON.parse(toolCall.function.arguments || '{}');
        
        console.log(chalk.magenta(`\n⚡ Executando: ${toolName}`));
        console.log(chalk.gray('   Parâmetros:', JSON.stringify(parameters, null, 2)));
        
        try {
          const result = await this.toolSystem.executeTool(toolName, parameters);
          console.log(chalk.green(`✅ ${toolName} executada com sucesso`));
          
          // Se for generate_content, precisamos salvar e validar
          if (toolName === 'generate_content') {
            await this.handleGeneratedContent(result, parameters);
          }
          
        } catch (error) {
          console.error(chalk.red(`❌ Erro ao executar ${toolName}:`), error);
        }
      }
    } else {
      // LLM respondeu diretamente sem tools
      console.log(chalk.blue('\n💬 Resposta direta da LLM:'));
      console.log(message.content);
    }
    
    // Adiciona à história
    this.conversationHistory.push(
      { role: 'user', content: originalInput },
      message
    );
  }
  
  /**
   * Processa conteúdo gerado
   */
  private async handleGeneratedContent(content: string, params: any): Promise<void> {
    console.log(chalk.cyan('\n📊 Processando conteúdo gerado...'));
    
    // Conta palavras
    const words = content.split(/\s+/).filter((w: string) => w.length > 0).length;
    console.log(chalk.blue(`📝 Palavras geradas: ${words.toLocaleString()}`));
    
    // Salva arquivo
    const filename = `${params.type}-${params.topic.replace(/\s+/g, '-')}-${Date.now()}.md`;
    const filepath = await this.toolSystem.executeTool('save_file', {
      filename,
      content,
      extension: 'md'
    });
    console.log(chalk.green(`✅ Arquivo salvo: ${filename}`));
    
    // Valida qualidade
    const validation = await this.toolSystem.executeTool('validate_quality', {
      content,
      requirements: params
    });
    console.log(chalk.yellow(`🎯 Análise de qualidade: ${validation.analysis}`));
    
    // Se qualidade baixa, tenta melhorar
    if (validation.analysis.includes('improve') || validation.analysis.includes('low')) {
      console.log(chalk.yellow('🔄 Melhorando conteúdo...'));
      const improved = await this.toolSystem.executeTool('improve_content', {
        content,
        feedback: ['Add more details', 'Improve structure', 'Expand examples']
      });
      
      // Salva versão melhorada
      await this.toolSystem.executeTool('save_file', {
        filename: filename.replace('.md', '-improved.md'),
        content: improved,
        extension: 'md'
      });
      console.log(chalk.green('✅ Versão melhorada salva'));
    }
  }
}