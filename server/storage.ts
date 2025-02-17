import { users, monthlyMenuItems, kids, lunchSelections, selectionHistory, holidays, type User, type MonthlyMenuItem, type InsertUser, type Kid, type InsertKid, type LunchSelection, type InsertLunchSelection, type SelectionHistory, type Holiday, type InsertHoliday } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Monthly Menu Items
  getMonthlyMenuItems(month: Date): Promise<MonthlyMenuItem[]>;
  getVegMenuItems(month: Date): Promise<MonthlyMenuItem[]>;
  getNonVegMenuItems(month: Date): Promise<MonthlyMenuItem[]>;

  // Kids
  getKidsByUserId(userId: number): Promise<Kid[]>;
  getKid(kidId: number): Promise<Kid | undefined>;
  createKid(kid: InsertKid): Promise<Kid>;
  updateKid(kidId: number, kid: Partial<InsertKid>): Promise<Kid | undefined>;
  deleteKid(kidId: number): Promise<boolean>;

  // Lunch Selections
  getLunchSelectionsForKid(kidId: number, month: Date): Promise<(LunchSelection & { menuItem: MonthlyMenuItem })[]>;
  createLunchSelection(selection: InsertLunchSelection): Promise<LunchSelection>;
  updateLunchSelection(id: number, selection: Partial<InsertLunchSelection>, userId: number): Promise<LunchSelection | undefined>;
  deleteLunchSelection(id: number): Promise<boolean>;

  // Holiday Management
  getHolidays(startDate: Date, endDate: Date): Promise<Holiday[]>;
  addHoliday(holiday: InsertHoliday): Promise<Holiday>;

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

  // User methods
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

  // Monthly Menu Items methods
  async getMonthlyMenuItems(month: Date): Promise<MonthlyMenuItem[]> {
    return await db
      .select()
      .from(monthlyMenuItems)
      .where(eq(monthlyMenuItems.month, month))
      .where(eq(monthlyMenuItems.isAvailable, true));
  }

  async getVegMenuItems(month: Date): Promise<MonthlyMenuItem[]> {
    return await db
      .select()
      .from(monthlyMenuItems)
      .where(eq(monthlyMenuItems.month, month))
      .where(eq(monthlyMenuItems.isVegetarian, true))
      .where(eq(monthlyMenuItems.isAvailable, true));
  }

  async getNonVegMenuItems(month: Date): Promise<MonthlyMenuItem[]> {
    return await db
      .select()
      .from(monthlyMenuItems)
      .where(eq(monthlyMenuItems.month, month))
      .where(eq(monthlyMenuItems.isVegetarian, false))
      .where(eq(monthlyMenuItems.isAvailable, true));
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

  // Lunch Selections methods
  async getLunchSelectionsForKid(kidId: number, month: Date): Promise<(LunchSelection & { menuItem: MonthlyMenuItem })[]> {
    return await db
      .select({
        id: lunchSelections.id,
        kidId: lunchSelections.kidId,
        menuItemId: lunchSelections.menuItemId,
        date: lunchSelections.date,
        createdAt: lunchSelections.createdAt,
        modifiedAt: lunchSelections.modifiedAt,
        menuItem: monthlyMenuItems,
      })
      .from(lunchSelections)
      .innerJoin(monthlyMenuItems, eq(lunchSelections.menuItemId, monthlyMenuItems.id))
      .where(eq(lunchSelections.kidId, kidId));
  }

  async createLunchSelection(selection: InsertLunchSelection): Promise<LunchSelection> {
    const [created] = await db.insert(lunchSelections).values(selection).returning();
    return created;
  }

  async updateLunchSelection(
    id: number,
    selection: Partial<InsertLunchSelection>,
    userId: number
  ): Promise<LunchSelection | undefined> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // First check if the selection can be modified (>24h before delivery)
    const [existingSelection] = await db
      .select()
      .from(lunchSelections)
      .where(eq(lunchSelections.id, id));

    if (!existingSelection) {
      console.log('No existing selection found for id:', id);
      return undefined;
    }

    // Convert the date string to Date object for comparison
    const selectionDate = new Date(existingSelection.date);
    selectionDate.setHours(0, 0, 0, 0);

    console.log('Debug date comparison:', {
      selectionDate: selectionDate.toISOString(),
      tomorrow: tomorrow.toISOString(),
      comparison: selectionDate < tomorrow
    });

    if (selectionDate < tomorrow) {
      console.log('Selection date is before tomorrow, cannot modify');
      return undefined;
    }

    try {
      // Create history record
      await db.insert(selectionHistory).values({
        selectionId: id,
        oldMenuItemId: existingSelection.menuItemId,
        newMenuItemId: selection.menuItemId!,
        changedBy: userId,
      });

      // Update the selection
      const [updated] = await db
        .update(lunchSelections)
        .set({ ...selection, modifiedAt: new Date() })
        .where(eq(lunchSelections.id, id))
        .returning();

      console.log('Successfully updated selection:', updated);
      return updated;
    } catch (error) {
      console.error('Error updating lunch selection:', error);
      return undefined;
    }
  }

  async deleteLunchSelection(id: number): Promise<boolean> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // First check if the selection can be deleted (>24h before delivery)
    const [existingSelection] = await db
      .select()
      .from(lunchSelections)
      .where(
        and(
          eq(lunchSelections.id, id),
          gte(lunchSelections.date, tomorrow)
        )
      );

    if (!existingSelection) {
      return false;
    }

    const [deleted] = await db
      .delete(lunchSelections)
      .where(eq(lunchSelections.id, id))
      .returning();

    return !!deleted;
  }

  // Holiday Management methods
  async getHolidays(startDate: Date, endDate: Date): Promise<Holiday[]> {
    return await db
      .select()
      .from(holidays)
      .where(
        and(
          gte(holidays.date, startDate),
          lte(holidays.date, endDate)
        )
      );
  }

  async addHoliday(holiday: InsertHoliday): Promise<Holiday> {
    const [created] = await db
      .insert(holidays)
      .values(holiday)
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();