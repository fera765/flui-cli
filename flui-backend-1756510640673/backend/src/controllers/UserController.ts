export class UserController {
  async getUsers(req: any, res: any) {
    res.json({ success: true, data: [] });
  }
  
  async createUser(req: any, res: any) {
    res.status(201).json({ success: true, data: req.body });
  }
}