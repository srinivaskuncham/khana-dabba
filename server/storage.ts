import { users, menuItems, kids, type User, type MenuItem, type InsertUser, type Kid, type InsertKid } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(category: string): Promise<MenuItem[]>;
  getKidsByUserId(userId: number): Promise<Kid[]>;
  getKid(kidId: number): Promise<Kid | undefined>;
  createKid(kid: InsertKid): Promise<Kid>;
  updateKid(kidId: number, kid: Partial<InsertKid>): Promise<Kid | undefined>;
  deleteKid(kidId: number): Promise<boolean>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems);
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    return await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.category, category));
  }

  // Kids related methods
  async getKidsByUserId(userId: number): Promise<Kid[]> {
    return await db.select().from(kids).where(eq(kids.userId, userId));
  }

  async getKid(kidId: number): Promise<Kid | undefined> {
    const [kid] = await db.select().from(kids).where(eq(kids.id, kidId));
    return kid;
  }

  async createKid(insertKid: InsertKid): Promise<Kid> {
    const [kid] = await db.insert(kids).values(insertKid).returning();
    return kid;
  }

  async updateKid(kidId: number, updateData: Partial<InsertKid>): Promise<Kid | undefined> {
    const [updated] = await db
      .update(kids)
      .set(updateData)
      .where(eq(kids.id, kidId))
      .returning();
    return updated;
  }

  async deleteKid(kidId: number): Promise<boolean> {
    const [deleted] = await db.delete(kids).where(eq(kids.id, kidId)).returning();
    return !!deleted;
  }
}

export const storage = new DatabaseStorage();