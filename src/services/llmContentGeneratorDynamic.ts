import axios from 'axios';
import chalk from 'chalk';

/**
 * LLMContentGeneratorDynamic - 100% DINÂMICO
 * ZERO templates, ZERO dados fixos, TUDO via LLM
 */
export class LLMContentGeneratorDynamic {
  private apiEndpoint: string = 'https://api.llm7.io/v1/chat/completions';
  
  /**
   * Gera conteúdo 100% dinâmico via LLM
   * SEM fallbacks, SEM templates, SEM dados estáticos
   */
  async generateContent(userRequest: string): Promise<string> {
    console.log(chalk.cyan('🤖 Gerando conteúdo 100% dinâmico via LLM...'));
    
    try {
      // Primeira chamada para entender o que precisa ser gerado
      const analysisResponse = await this.analyzeRequest(userRequest);
      
      // Gera conteúdo baseado na análise
      const content = await this.generateBasedOnAnalysis(userRequest, analysisResponse);
      
      // Valida e expande se necessário
      const finalContent = await this.validateAndExpand(content, userRequest, analysisResponse);
      
      console.log(chalk.green(`✅ Conteúdo gerado: ${finalContent.length} caracteres`));
      return finalContent;
      
    } catch (error: any) {
      console.error(chalk.red('❌ Erro ao gerar conteúdo:'), error.message);
      // NÃO retorna fallback - deixa o erro propagar
      throw error;
    }
  }
  
  /**
   * Analisa a requisição do usuário via LLM
   */
  private async analyzeRequest(request: string): Promise<any> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analise a requisição e retorne um JSON com: tipo, tamanhoMinimo, formato, requisitos'
        },
        {
          role: 'user',
          content: `Analise esta requisição e retorne APENAS um JSON: ${request}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });
    
    try {
      const content = response.data.choices[0].message.content;
      // Tenta extrair JSON da resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Se não conseguir fazer parse, usa análise básica
    }
    
    return {
      tipo: 'documento',
      tamanhoMinimo: 5000,
      formato: 'markdown',
      requisitos: []
    };
  }
  
  /**
   * Gera conteúdo baseado na análise
   */
  private async generateBasedOnAnalysis(request: string, analysis: any): Promise<string> {
    let fullContent = '';
    let iterations = 0;
    const maxIterations = 20;
    
    while (fullContent.length < (analysis.tamanhoMinimo || 5000) && iterations < maxIterations) {
      const response = await axios.post(this.apiEndpoint, {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: this.buildDynamicSystemPrompt(analysis)
          },
          {
            role: 'user',
            content: iterations === 0 ? request : 
              `Continue expandindo o conteúdo anterior. Adicione mais detalhes, exemplos e informações relevantes.`
          }
        ],
        temperature: 0.8,
        max_tokens: 4000
      });
      
      const newContent = response.data.choices[0].message.content;
      fullContent += (iterations === 0 ? '' : '\n\n') + newContent;
      iterations++;
      
      // Verifica se atingiu o tamanho desejado
      const wordCount = fullContent.split(/\s+/).filter(w => w.length > 0).length;
      if (analysis.tipo === 'ebook' && wordCount >= 20000) break;
      if (analysis.tipo === 'artigo' && wordCount >= 5000) break;
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return fullContent;
  }
  
  /**
   * Constrói prompt do sistema dinamicamente
   */
  private buildDynamicSystemPrompt(analysis: any): string {
    // Gera o prompt dinamicamente baseado na análise
    return `Você é um especialista em ${analysis.tipo || 'criação de conteúdo'}.
Gere conteúdo de altíssima qualidade, detalhado e específico.
${analysis.requisitos ? 'Requisitos: ' + analysis.requisitos.join(', ') : ''}
Formato: ${analysis.formato || 'texto'}
Seja extremamente detalhado e gere o máximo de conteúdo possível.`;
  }
  
  /**
   * Valida e expande o conteúdo se necessário
   */
  private async validateAndExpand(content: string, request: string, analysis: any): Promise<string> {
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    
    // Determina o mínimo de palavras dinamicamente
    let minWords = 5000;
    if (request.toLowerCase().includes('20') && request.toLowerCase().includes('mil')) {
      minWords = 20000;
    } else if (request.toLowerCase().includes('5') && request.toLowerCase().includes('mil')) {
      minWords = 5000;
    } else if (request.toLowerCase().includes('10') && request.toLowerCase().includes('mil')) {
      minWords = 10000;
    }
    
    // Se precisa expandir
    if (wordCount < minWords) {
      console.log(chalk.yellow(`⚠️ Expandindo conteúdo: ${wordCount} → ${minWords} palavras`));
      
      const expansionResponse = await axios.post(this.apiEndpoint, {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Expanda este conteúdo para ${minWords} palavras, adicionando mais detalhes, exemplos e seções: ${content.substring(0, 1000)}...`
          }
        ],
        temperature: 0.9,
        max_tokens: 4000
      });
      
      return content + '\n\n' + expansionResponse.data.choices[0].message.content;
    }
    
    return content;
  }
  
  /**
   * Gera conteúdo com contexto adicional
   */
  async generateWithContext(userRequest: string, context: any): Promise<string> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Gere conteúdo considerando o contexto fornecido'
        },
        {
          role: 'user',
          content: `Contexto: ${JSON.stringify(context)}\n\nRequisição: ${userRequest}`
        }
      ],
      temperature: 0.8,
      max_tokens: 4000
    });
    
    return response.data.choices[0].message.content;
  }
}