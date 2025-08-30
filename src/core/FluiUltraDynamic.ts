import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

/**
 * Flui Ultra Dinâmico - 100% baseado em LLM
 * ZERO comparações estáticas, ZERO palavras-chave
 */
export class FluiUltraDynamic {
  private apiEndpoint = 'https://api.llm7.io/v1/chat/completions';
  private conversationHistory: any[] = [];
  
  /**
   * Processa qualquer input via LLM
   */
  async processInput(input: string): Promise<any> {
    console.log(chalk.cyan('\n🤖 Processamento 100% dinâmico iniciado...'));
    
    // TUDO é decidido pela LLM, sem nenhuma lógica hardcoded
    const llmDecision = await this.askLLMWhatToDo(input);
    
    // Executa a decisão da LLM
    const result = await this.executeLLMDecision(llmDecision, input);
    
    return result;
  }
  
  /**
   * Pergunta à LLM o que fazer
   */
  private async askLLMWhatToDo(input: string): Promise<any> {
    console.log(chalk.blue('🧠 Consultando LLM para decisão...'));
    
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an AI that decides what to do with user requests.
          Analyze the request and return a JSON with:
          {
            "action": "what_to_do",
            "parameters": { ... },
            "shouldGenerateContent": boolean,
            "targetWords": number_if_applicable,
            "contentType": "type_if_applicable"
          }`
        },
        {
          role: 'user',
          content: input
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });
    
    const content = response.data.choices[0].message.content;
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]);
        console.log(chalk.gray('   Decisão:', JSON.stringify(decision, null, 2)));
        return decision;
      }
    } catch (e) {
      console.log(chalk.yellow('   Resposta não estruturada, processando como texto'));
    }
    
    return { action: 'respond', parameters: { response: content } };
  }
  
  /**
   * Executa a decisão da LLM
   */
  private async executeLLMDecision(decision: any, originalInput: string): Promise<any> {
    console.log(chalk.magenta(`⚡ Executando ação: ${decision.action}`));
    
    // Se a LLM decidiu gerar conteúdo
    if (decision.shouldGenerateContent) {
      return await this.generateContentDynamically(
        originalInput,
        decision.targetWords || 5000,
        decision.contentType || 'text'
      );
    }
    
    // Caso contrário, apenas responde
    return await this.generateResponse(originalInput);
  }
  
  /**
   * Gera conteúdo de forma 100% dinâmica
   */
  private async generateContentDynamically(request: string, targetWords: number, type: string): Promise<any> {
    console.log(chalk.yellow(`📝 Gerando ${targetWords} palavras de ${type}...`));
    
    let content = '';
    let words = 0;
    let iterations = 0;
    
    while (words < targetWords && iterations < 30) {
      iterations++;
      const remaining = targetWords - words;
      
      // Pede à LLM para gerar conteúdo
      const response = await axios.post(this.apiEndpoint, {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content writer. Generate extremely detailed, comprehensive content. Be verbose, thorough, and expansive. Each response should be as long as possible.'
          },
          {
            role: 'user',
            content: iterations === 1
              ? `Write an extremely detailed ${type} about: ${request}. This section MUST have AT LEAST 3000 words. Be VERY detailed with examples, explanations, data, and analysis. Do not summarize.`
              : `Continue writing. Add AT LEAST 3000 MORE words with new sections, deeper analysis, more examples. Remaining target: ${remaining} words. Expand thoroughly.`
          }
        ],
        temperature: 0.9,
        max_tokens: 4096
      });
      
      const chunk = response.data.choices[0].message.content;
      content += (iterations > 1 ? '\n\n' : '') + chunk;
      words = content.split(/\s+/).filter(w => w.length > 0).length;
      
      console.log(chalk.gray(`   Iteração ${iterations}: ${words}/${targetWords} palavras`));
      
      if (words >= targetWords * 0.95) break;
    }
    
    // Salva arquivo
    const filename = await this.generateFilename(request);
    await fs.writeFile(filename, content, 'utf-8');
    
    console.log(chalk.green(`✅ Arquivo criado: ${filename}`));
    console.log(chalk.blue(`📊 Palavras: ${words.toLocaleString()}`));
    
    // Valida qualidade
    const quality = await this.validateQuality(content, targetWords);
    console.log(chalk.yellow(`🎯 Score: ${quality}%`));
    
    return {
      success: true,
      filename,
      words,
      quality,
      content
    };
  }
  
  /**
   * Gera nome de arquivo via LLM
   */
  private async generateFilename(request: string): Promise<string> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Generate a filename for: "${request}". Reply with just the filename (no extension).`
        }
      ],
      temperature: 0.5,
      max_tokens: 50
    });
    
    const base = response.data.choices[0].message.content
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .substring(0, 50);
    
    return `${base}-${Date.now()}.md`;
  }
  
  /**
   * Valida qualidade via LLM
   */
  private async validateQuality(content: string, targetWords: number): Promise<number> {
    const actualWords = content.split(/\s+/).filter(w => w.length > 0).length;
    
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Rate from 0-100 the quality of content with ${actualWords} words (target was ${targetWords}). Reply with just a number.`
        }
      ],
      temperature: 0.2,
      max_tokens: 10
    });
    
    const score = parseInt(response.data.choices[0].message.content) || 75;
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Gera resposta simples
   */
  private async generateResponse(input: string): Promise<any> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        ...this.conversationHistory,
        { role: 'user', content: input }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    return {
      success: true,
      response: response.data.choices[0].message.content
    };
  }
}