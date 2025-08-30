import axios from 'axios';

/**
 * DynamicIntentDetector - Detecção de intenções 100% via LLM
 * ZERO palavras-chave fixas, TUDO analisado dinamicamente
 */
export class DynamicIntentDetector {
  private apiEndpoint: string = 'https://api.llm7.io/v1/chat/completions';
  
  /**
   * Detecta intenções do usuário 100% dinamicamente
   */
  async detectIntent(userInput: string): Promise<{
    intent: string;
    entities: any;
    confidence: number;
    suggestedActions: string[];
  }> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Analise a intenção do usuário e retorne um JSON com:
{
  "intent": "tipo_de_intencao",
  "entities": { "chaves": "valores extraídos" },
  "confidence": 0.0-1.0,
  "suggestedActions": ["ações sugeridas"]
}`
        },
        {
          role: 'user',
          content: userInput
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });
    
    try {
      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Se falhar, retorna análise genérica
    }
    
    return {
      intent: 'general',
      entities: {},
      confidence: 0.5,
      suggestedActions: ['generate_response']
    };
  }
  
  /**
   * Detecta necessidade de ferramentas dinamicamente
   */
  async detectToolsNeeded(userInput: string, context?: any): Promise<string[]> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analise o pedido e retorne um array JSON com as ferramentas necessárias'
        },
        {
          role: 'user',
          content: `Pedido: ${userInput}\nContexto: ${JSON.stringify(context || {})}\n\nQuais ferramentas são necessárias?`
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
    } catch (e) {
      // Continua sem ferramentas se falhar
    }
    
    return [];
  }
  
  /**
   * Extrai parâmetros para ferramentas dinamicamente
   */
  async extractToolParams(userInput: string, toolName: string): Promise<any> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Extraia os parâmetros necessários para a ferramenta ${toolName} e retorne como JSON`
        },
        {
          role: 'user',
          content: userInput
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });
    
    try {
      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Retorna parâmetros vazios se falhar
    }
    
    return {};
  }
}