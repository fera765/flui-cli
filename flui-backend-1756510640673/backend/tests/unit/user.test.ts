import { UserController } from '../../src/controllers/UserController';
import { UserService } from '../../src/services/UserService';

describe('UserController', () => {
  it('should be defined', () => {
    expect(UserController).toBeDefined();
  });
});

describe('UserService', () => {
  it('should be defined', () => {
    expect(UserService).toBeDefined();
  });
});