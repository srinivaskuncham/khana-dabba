import { User, MenuItem, InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(category: string): Promise<MenuItem[]>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private menuItems: Map<number, MenuItem>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.menuItems = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Seed menu items
    const menuItems: MenuItem[] = [
      {
        id: 1,
        name: "Butter Chicken",
        description: "Creamy, rich curry with tender chicken",
        price: 299,
        imageUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601",
        category: "Mains",
        isAvailable: true
      },
      {
        id: 2,
        name: "Palak Paneer",
        description: "Cottage cheese in spinach gravy",
        price: 249,
        imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352",
        category: "Mains",
        isAvailable: true
      },
      // Add more menu items as needed
    ];

    menuItems.forEach(item => this.menuItems.set(item.id, item));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(
      item => item.category === category && item.isAvailable
    );
  }
}

export const storage = new MemStorage();
