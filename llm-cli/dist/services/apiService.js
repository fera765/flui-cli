"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
const axios_1 = __importDefault(require("axios"));
class ApiService {
    constructor() {
        this.baseUrl = 'https://api.llm7.io/v1';
    }
    async fetchModels() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/models`);
            const allModels = Array.isArray(response.data)
                ? response.data
                : (response.data.data || []);
            // Try to get models with context_length first
            let selectedModels = allModels
                .filter((m) => m.context_length && m.context_length > 0)
                .sort((a, b) => b.context_length - a.context_length)
                .slice(0, 3);
            // If no models have context_length, use popular models
            if (selectedModels.length === 0) {
                const popularModels = ['deepseek-r1-0528', 'gemini', 'gpt-5-nano-2025-08-07'];
                selectedModels = allModels
                    .filter((m) => popularModels.includes(m.id))
                    .map((m) => ({
                    ...m,
                    context_length: m.context_length || 128000,
                    description: m.description || m.id
                }));
            }
            // If still no models, use first 3
            if (selectedModels.length === 0) {
                selectedModels = allModels.slice(0, 3).map((m) => ({
                    ...m,
                    context_length: m.context_length || 128000,
                    description: m.description || m.id
                }));
            }
            if (selectedModels.length === 0) {
                throw new Error('No models available');
            }
            return selectedModels;
        }
        catch (error) {
            throw new Error('Failed to fetch models');
        }
    }
    async sendMessage(message, model, history) {
        try {
            const messages = [
                ...history,
                { role: 'user', content: message }
            ];
            const response = await axios_1.default.post(`${this.baseUrl}/chat/completions`, {
                model,
                messages,
                stream: false
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data.choices[0].message.content;
        }
        catch (error) {
            throw new Error('Failed to send message');
        }
    }
}
exports.ApiService = ApiService;
//# sourceMappingURL=apiService.js.map