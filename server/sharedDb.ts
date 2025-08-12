/** Shared Mock Replit DB for development **/
class MockReplitDB {
  private data: Record<string, any> = {};

  async get(key: string) {
    return this.data[key] || null;
  }

  async set(key: string, value: any) {
    this.data[key] = value;
  }
}

// Create a single shared DB instance that both index.ts and routes.ts will use
export const db = new MockReplitDB();

export const EMPLOYEES_KEY = "employees";
export const EQUIPMENT_KEY = "equipment";
export const PROJECTS_KEY = "projects";