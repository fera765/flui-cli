import axios from 'axios';

/**
 * DynamicAnalyzer - Analisa requisições sem palavras-chave fixas
 * 100% dinâmico usando apenas LLM
 */
export class DynamicAnalyzer {
  private apiEndpoint = 'https://api.llm7.io/v1/chat/completions';
  private debugMode = true;
  
  private log(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`[DynamicAnalyzer] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }
  
  /**
   * Analisa requisição completamente via LLM
   */
  async analyzeRequest(input: string): Promise<{
    action: string;
    requirements: any;
    confidence: number;
  }> {
    this.log('Analyzing request', input);
    
    try {
      const response = await axios.post(this.apiEndpoint, {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Analyze the user request and return a JSON with: action (what to do), requirements (extracted details), confidence (0-1)'
          },
          {
            role: 'user',
            content: `Analyze this request and extract ALL information as JSON: "${input}"`
          }
        ],
        temperature: 0.2,
        max_tokens: 500
      });
      
      const content = response.data.choices[0].message.content;
      this.log('Analysis result', content);
      
      // Tenta extrair JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        this.log('Parsed analysis', result);
        return result;
      }
    } catch (error) {
      this.log('Analysis error', error);
    }
    
    return {
      action: 'unknown',
      requirements: {},
      confidence: 0
    };
  }
  
  /**
   * Detecta intenção sem palavras fixas
   */
  async detectIntent(input: string): Promise<string> {
    this.log('Detecting intent', input);
    
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `What is the main intent of this request? Reply with ONE word only: "${input}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 20
    });
    
    const intent = response.data.choices[0].message.content.trim().toLowerCase();
    this.log('Detected intent', intent);
    return intent;
  }
  
  /**
   * Extrai requisitos numericamente
   */
  async extractNumericRequirements(input: string): Promise<number> {
    this.log('Extracting numeric requirements', input);
    
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Extract the target number from this request (if any). Reply with ONLY the number: "${input}"`
        }
      ],
      temperature: 0,
      max_tokens: 20
    });
    
    const numberStr = response.data.choices[0].message.content.trim();
    const number = parseInt(numberStr.replace(/[^\d]/g, '')) || 0;
    this.log('Extracted number', number);
    return number;
  }
}