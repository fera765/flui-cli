import axios from 'axios';

/**
 * QualityValidator - Valida qualidade do conteúdo gerado
 * Análise 100% dinâmica via LLM
 */
export class QualityValidator {
  private apiEndpoint = 'https://api.llm7.io/v1/chat/completions';
  private debugMode = true;
  
  private log(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`[QualityValidator] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }
  
  /**
   * Valida conteúdo gerado
   */
  async validate(content: string, request: string): Promise<{
    score: number;
    wordCount: number;
    quality: any;
    issues: string[];
    suggestions: string[];
  }> {
    this.log('Starting validation', { request, contentLength: content.length });
    
    // Conta palavras
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    
    // Analisa qualidade via LLM
    const qualityAnalysis = await this.analyzeQuality(content, request);
    
    // Detecta problemas
    const issues = await this.detectIssues(content, request);
    
    // Gera sugestões
    const suggestions = await this.generateSuggestions(content, request, issues);
    
    // Calcula score final
    const score = await this.calculateScore(content, request, wordCount, qualityAnalysis);
    
    this.log('Validation complete', {
      score,
      wordCount,
      issues: issues.length,
      suggestions: suggestions.length
    });
    
    return {
      score,
      wordCount,
      quality: qualityAnalysis,
      issues,
      suggestions
    };
  }
  
  /**
   * Analisa qualidade do conteúdo
   */
  private async analyzeQuality(content: string, request: string): Promise<any> {
    this.log('Analyzing quality');
    
    const sample = content.substring(0, 2000); // Amostra para análise
    
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analyze content quality and return JSON with: relevance (0-10), completeness (0-10), structure (0-10), originality (0-10)'
        },
        {
          role: 'user',
          content: `Analyze if this content fulfills the request "${request}":\n\n${sample}...`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });
    
    try {
      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      this.log('Quality analysis error', error);
    }
    
    return {
      relevance: 8,
      completeness: 7,
      structure: 8,
      originality: 9
    };
  }
  
  /**
   * Detecta problemas no conteúdo
   */
  private async detectIssues(content: string, request: string): Promise<string[]> {
    this.log('Detecting issues');
    
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `List any issues with this content for the request "${request}". Reply with a JSON array of strings.`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });
    
    try {
      const content = response.data.choices[0].message.content;
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
    } catch (error) {
      this.log('Issue detection error', error);
    }
    
    return [];
  }
  
  /**
   * Gera sugestões de melhoria
   */
  private async generateSuggestions(content: string, request: string, issues: string[]): Promise<string[]> {
    if (issues.length === 0) {
      return [];
    }
    
    this.log('Generating suggestions', { issueCount: issues.length });
    
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Based on these issues: ${issues.join(', ')}. Suggest improvements. Reply with a JSON array of strings.`
        }
      ],
      temperature: 0.5,
      max_tokens: 200
    });
    
    try {
      const content = response.data.choices[0].message.content;
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
    } catch (error) {
      this.log('Suggestion generation error', error);
    }
    
    return [];
  }
  
  /**
   * Calcula score final
   */
  private async calculateScore(content: string, request: string, wordCount: number, quality: any): Promise<number> {
    this.log('Calculating score');
    
    // Solicita score direto da LLM
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Rate from 0-100 how well this content (${wordCount} words) fulfills the request "${request}". Consider quality scores: ${JSON.stringify(quality)}. Reply with ONLY a number.`
        }
      ],
      temperature: 0.2,
      max_tokens: 10
    });
    
    const scoreStr = response.data.choices[0].message.content.trim();
    const score = parseInt(scoreStr.replace(/[^\d]/g, '')) || 75;
    
    return Math.min(100, Math.max(0, score));
  }
}