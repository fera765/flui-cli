import axios from 'axios';

export interface Model {
  id: string;
  context_length: number;
  description: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class ApiService {
  private baseUrl = 'https://api.llm7.io/v1';

  async fetchModels(): Promise<Model[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`);
      const allModels = Array.isArray(response.data) 
        ? response.data 
        : (response.data.data || []);
      
      // Try to get models with context_length first
      let selectedModels = allModels
        .filter((m: any) => m.context_length && m.context_length > 0)
        .sort((a: any, b: any) => b.context_length - a.context_length)
        .slice(0, 3);

      // If no models have context_length, use popular models
      if (selectedModels.length === 0) {
        const popularModels = ['deepseek-r1-0528', 'gemini', 'gpt-5-nano-2025-08-07'];
        selectedModels = allModels
          .filter((m: any) => popularModels.includes(m.id))
          .map((m: any) => ({
            ...m,
            context_length: m.context_length || 128000,
            description: m.description || m.id
          }));
      }

      // If still no models, use first 3
      if (selectedModels.length === 0) {
        selectedModels = allModels.slice(0, 3).map((m: any) => ({
          ...m,
          context_length: m.context_length || 128000,
          description: m.description || m.id
        }));
      }

      if (selectedModels.length === 0) {
        throw new Error('No models available');
      }

      return selectedModels as Model[];
    } catch (error) {
      throw new Error('Failed to fetch models');
    }
  }

  async sendMessage(
    message: string, 
    model: string, 
    history: Message[]
  ): Promise<string> {
    try {
      const messages = [
        ...history,
        { role: 'user' as const, content: message }
      ];

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      throw new Error('Failed to send message');
    }
  }
}