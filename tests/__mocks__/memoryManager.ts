export class MemoryManager {
  addPrimaryMessage = jest.fn();
  getRecentMessages = jest.fn().mockReturnValue([]);
  saveCheckpoint = jest.fn();
  loadCheckpoint = jest.fn().mockReturnValue(null);
  addToPrimary = jest.fn();
  getAllPrimary = jest.fn().mockReturnValue([]);
  exportForLLM = jest.fn().mockReturnValue([]);
  
  constructor() {
    // Mock constructor
  }
}