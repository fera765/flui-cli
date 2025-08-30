export class settingsService {
  async create(data: any) {
    // Business logic here
    return { id: '1', ...data };
  }
  
  async getAll() {
    return [];
  }
  
  async getById(id: string) {
    return { id };
  }
  
  async update(id: string, data: any) {
    return { id, ...data };
  }
  
  async delete(id: string) {
    return true;
  }
}