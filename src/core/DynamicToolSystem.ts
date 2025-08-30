import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Sistema de Tools 100% Dinâmico
 * Todas as ferramentas são descritas para a LLM decidir quando usar
 */
export class DynamicToolSystem {
  private apiEndpoint = 'https://api.llm7.io/v1/chat/completions';
  
  /**
   * Define todas as ferramentas disponíveis em formato OpenAI
   */
  getToolsSchema() {
    return [
      {
        type: 'function',
        function: {
          name: 'analyze_request',
          description: 'Analyze any user request to understand intent, requirements and how to fulfill it',
          parameters: {
            type: 'object',
            properties: {
              request: {
                type: 'string',
                description: 'The user request to analyze'
              }
            },
            required: ['request']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_content',
          description: 'Generate any type of content (text, code, documentation, etc) based on requirements',
          parameters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: 'Type of content to generate'
              },
              topic: {
                type: 'string',
                description: 'Main topic or subject'
              },
              word_count: {
                type: 'number',
                description: 'Target number of words'
              },
              language: {
                type: 'string',
                description: 'Language for the content'
              },
              format: {
                type: 'string',
                description: 'Output format (markdown, code, etc)'
              }
            },
            required: ['type', 'topic']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'save_file',
          description: 'Save generated content to a file',
          parameters: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'Name for the file'
              },
              content: {
                type: 'string',
                description: 'Content to save'
              },
              extension: {
                type: 'string',
                description: 'File extension'
              }
            },
            required: ['content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'validate_quality',
          description: 'Validate the quality of generated content',
          parameters: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Content to validate'
              },
              requirements: {
                type: 'object',
                description: 'Original requirements to check against'
              }
            },
            required: ['content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'improve_content',
          description: 'Improve existing content based on feedback',
          parameters: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Content to improve'
              },
              feedback: {
                type: 'array',
                items: { type: 'string' },
                description: 'Improvement suggestions'
              }
            },
            required: ['content', 'feedback']
          }
        }
      }
    ];
  }
  
  /**
   * Executa ferramentas baseado na decisão da LLM
   */
  async executeTool(toolName: string, parameters: any): Promise<any> {
    console.log(`🔧 Executando tool: ${toolName}`);
    
    switch(toolName) {
      case 'analyze_request':
        return await this.analyzeRequest(parameters.request);
        
      case 'generate_content':
        return await this.generateContent(parameters);
        
      case 'save_file':
        return await this.saveFile(parameters);
        
      case 'validate_quality':
        return await this.validateQuality(parameters);
        
      case 'improve_content':
        return await this.improveContent(parameters);
        
      default:
        throw new Error(`Tool não reconhecida: ${toolName}`);
    }
  }
  
  /**
   * Analisa requisição via LLM
   */
  private async analyzeRequest(request: string): Promise<any> {
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analyze the request and extract all relevant information as structured JSON'
        },
        {
          role: 'user',
          content: request
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });
    
    return response.data.choices[0].message.content;
  }
  
  /**
   * Gera conteúdo dinamicamente
   */
  private async generateContent(params: any): Promise<string> {
    const { type, topic, word_count = 5000, language = 'pt-BR', format = 'markdown' } = params;
    
    let content = '';
    let words = 0;
    const target = word_count;
    
    while (words < target) {
      const remaining = target - words;
      
      const response = await axios.post(this.apiEndpoint, {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Generate ${type} content about ${topic} in ${language} format ${format}`
          },
          {
            role: 'user',
            content: words === 0 
              ? `Start writing. Need ${remaining} words total.`
              : `Continue writing. Add ${remaining} more words.`
          }
        ],
        temperature: 0.8,
        max_tokens: 4000
      });
      
      const chunk = response.data.choices[0].message.content;
      content += (words > 0 ? '\n\n' : '') + chunk;
      words = content.split(/\s+/).filter((w: string) => w.length > 0).length;
      
      console.log(`📝 Progresso: ${words}/${target} palavras`);
      
      if (words >= target * 0.95) break; // 95% é suficiente
    }
    
    return content;
  }
  
  /**
   * Salva arquivo
   */
  private async saveFile(params: any): Promise<string> {
    const { filename, content, extension = 'md' } = params;
    
    const finalName = filename || `output-${Date.now()}.${extension}`;
    const filepath = path.join(process.cwd(), finalName);
    
    await fs.writeFile(filepath, content, 'utf-8');
    
    return filepath;
  }
  
  /**
   * Valida qualidade
   */
  private async validateQuality(params: any): Promise<any> {
    const { content, requirements = {} } = params;
    
    const words = content.split(/\s+/).filter((w: string) => w.length > 0).length;
    
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Rate content quality from 0-100 and provide detailed feedback'
        },
        {
          role: 'user',
          content: `Content has ${words} words. Requirements: ${JSON.stringify(requirements)}. Rate and analyze.`
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });
    
    return {
      words,
      analysis: response.data.choices[0].message.content
    };
  }
  
  /**
   * Melhora conteúdo
   */
  private async improveContent(params: any): Promise<string> {
    const { content, feedback } = params;
    
    const response = await axios.post(this.apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Improve the content based on feedback'
        },
        {
          role: 'user',
          content: `Improve this content based on: ${feedback.join(', ')}\n\nContent: ${content.substring(0, 1000)}...`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    return response.data.choices[0].message.content;
  }
}