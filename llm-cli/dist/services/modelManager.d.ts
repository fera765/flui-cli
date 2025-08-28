import { ApiService, Model } from './apiService';
export declare class ModelManager {
    private apiService;
    private models;
    private currentModelIndex;
    constructor(apiService: ApiService);
    initialize(): Promise<void>;
    selectModel(index: number): void;
    getCurrentModel(): Model;
    getCurrentModelId(): string;
    getAvailableModels(): Model[];
    getFormattedModelList(): string;
}
//# sourceMappingURL=modelManager.d.ts.map