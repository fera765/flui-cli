import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * ContentGenerator - Gera conteúdo 100% dinâmico
 * Sem templates, sem dados fixos
 */
export class ContentGenerator {
  private apiEndpoint = 'https://api.llm7.io/v1/chat/completions';
  private debugMode = true;
  private generationStats = {
    iterations: 0,
    totalWords: 0,
    totalTime: 0,
    errors: 0
  };
  
  private log(message: string, data?: any) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[ContentGenerator] ${timestamp} - ${message}`, data || '');
    }
  }
  
  /**
   * Gera conteúdo baseado em análise dinâmica
   */
  async generate(request: string, analysis: any): Promise<{
    content: string;
    stats: any;
    filename: string;
  }> {
    this.log('Starting generation', { request, analysis });
    const startTime = Date.now();
    
    // Reset stats
    this.generationStats = {
      iterations: 0,
      totalWords: 0,
      totalTime: 0,
      errors: 0
    };
    
    // Determina objetivo dinamicamente
    const targetWords = await this.determineTargetWords(request, analysis);
    this.log('Target words determined', targetWords);
    
    // Gera conteúdo iterativamente
    let fullContent = '';
    let currentWords = 0;
    
    while (currentWords < targetWords) {
      this.generationStats.iterations++;
      const remaining = targetWords - currentWords;
      
      this.log(`Iteration ${this.generationStats.iterations}`, {
        current: currentWords,
        target: targetWords,
        remaining: remaining
      });
      
      try {
        const chunk = await this.generateChunk(request, fullContent, remaining);
        fullContent += (fullContent ? '\n\n' : '') + chunk;
        currentWords = this.countWords(fullContent);
        this.generationStats.totalWords = currentWords;
        
        // Log progress
        const progress = (currentWords / targetWords * 100).toFixed(1);
        this.log(`Progress: ${progress}%`, { words: currentWords });
        
      } catch (error) {
        this.generationStats.errors++;
        this.log('Generation error', error);
        
        if (this.generationStats.errors > 5) {
          this.log('Too many errors, stopping generation');
          break;
        }
      }
      
      // Limite de segurança
      if (this.generationStats.iterations > 50) {
        this.log('Max iterations reached');
        break;
      }
    }
    
    // Gera nome de arquivo dinamicamente
    const filename = await this.generateFilename(request, analysis);
    
    // Salva arquivo
    const filepath = path.join(process.cwd(), filename);
    await fs.writeFile(filepath, fullContent, 'utf-8');
    
    this.generationStats.totalTime = Date.now() - startTime;
    
    this.log('Generation complete', {
      words: currentWords,
      iterations: this.generationStats.iterations,
      time: `${(this.generationStats.totalTime / 1000).toFixed(1)}s`,
      filename: filename
    });
    
    return {
      content: fullContent,
      stats: this.generationStats,
      filename: filename
    };
  }
  
  /**
   * Determina quantidade de palavras dinamicamente
   */
  private async determineTargetWords(request: string, analysis: any): Promise<number> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `How many words should be generated for this request? Consider the context and reply with ONLY a number: "${request}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 20
    });
    
    const numberStr = response.data.choices[0].message.content.trim();
    const number = parseInt(numberStr.replace(/[^\d]/g, '')) || 5000;
    return Math.max(number, 1000); // Mínimo 1000 palavras
  }
  
  /**
   * Gera chunk de conteúdo
   */
  private async generateChunk(request: string, existingContent: string, targetWords: number): Promise<string> {
    const hasContent = existingContent.length > 0;
    
    const prompt = hasContent
      ? `Continue writing. Add ${targetWords} more words to complete the request: "${request}"`
      : `Write content for: "${request}". Generate at least ${Math.min(targetWords, 2000)} words.`;
    
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Generate detailed, high-quality content. Be specific and comprehensive.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000
    }, {
      timeout: 30000
    });
    
    return response.data.choices[0].message.content;
  }
  
  /**
   * Conta palavras
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }
  
  /**
   * Gera nome de arquivo dinamicamente
   */
  private async generateFilename(request: string, analysis: any): Promise<string> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Generate a filename for this content (without extension): "${request}". Reply with ONLY the filename.`
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
    
    const timestamp = Date.now();
    return `${base}-${timestamp}.md`;
  }
}