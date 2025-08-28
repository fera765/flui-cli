export interface Model {
    id: string;
    context_length: number;
    description: string;
}
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export declare class ApiService {
    private baseUrl;
    fetchModels(): Promise<Model[]>;
    sendMessage(message: string, model: string, history: Message[]): Promise<string>;
}
//# sourceMappingURL=apiService.d.ts.map