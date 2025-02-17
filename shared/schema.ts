import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  gender: text("gender"),
  profilePicture: text("profile_picture"),
  isAdmin: boolean("is_admin").notNull().default(false), 
});

export const kids = pgTable("kids", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  school: text("school").notNull(),
  rollNumber: text("roll_number").notNull(),
  gender: text("gender"),
  profilePicture: text("profile_picture"),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
});

export const monthlyMenuItems = pgTable("monthly_menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isVegetarian: boolean("is_vegetarian").notNull(),
  price: integer("price").notNull(),
  month: date("month").notNull(),
  imageUrl: text("image_url").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const lunchSelections = pgTable("lunch_selections", {
  id: serial("id").primaryKey(),
  kidId: integer("kid_id").references(() => kids.id, { onDelete: "cascade" }).notNull(),
  menuItemId: integer("menu_item_id").references(() => monthlyMenuItems.id).notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  modifiedAt: timestamp("modified_at").notNull().defaultNow(),
});

export const selectionHistory = pgTable("selection_history", {
  id: serial("id").primaryKey(),
  selectionId: integer("selection_id").references(() => lunchSelections.id).notNull(),
  oldMenuItemId: integer("old_menu_item_id").references(() => monthlyMenuItems.id),
  newMenuItemId: integer("new_menu_item_id").references(() => monthlyMenuItems.id).notNull(),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  changedBy: integer("changed_by").references(() => users.id).notNull(),
});

export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  kids: many(kids),
}));

export const kidsRelations = relations(kids, ({ one, many }) => ({
  user: one(users, {
    fields: [kids.userId],
    references: [users.id],
  }),
  lunchSelections: many(lunchSelections),
}));

export const lunchSelectionsRelations = relations(lunchSelections, ({ one, many }) => ({
  kid: one(kids, {
    fields: [lunchSelections.kidId],
    references: [kids.id],
  }),
  menuItem: one(monthlyMenuItems, {
    fields: [lunchSelections.menuItemId],
    references: [monthlyMenuItems.id],
  }),
  history: many(selectionHistory),
}));

export const selectionHistoryRelations = relations(selectionHistory, ({ one }) => ({
  selection: one(lunchSelections, {
    fields: [selectionHistory.selectionId],
    references: [lunchSelections.id],
  }),
  oldMenuItem: one(monthlyMenuItems, {
    fields: [selectionHistory.oldMenuItemId],
    references: [monthlyMenuItems.id],
  }),
  newMenuItem: one(monthlyMenuItems, {
    fields: [selectionHistory.newMenuItemId],
    references: [monthlyMenuItems.id],
  }),
  changedByUser: one(users, {
    fields: [selectionHistory.changedBy],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
});

export const insertAdminSchema = insertUserSchema.extend({
  isAdmin: z.literal(true),
});

export const insertKidSchema = createInsertSchema(kids);
export const insertMonthlyMenuItemSchema = createInsertSchema(monthlyMenuItems);
export const insertLunchSelectionSchema = createInsertSchema(lunchSelections);
export const insertSelectionHistorySchema = createInsertSchema(selectionHistory);
export const insertHolidaySchema = createInsertSchema(holidays);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type User = typeof users.$inferSelect;
export type Kid = typeof kids.$inferSelect;
export type MonthlyMenuItem = typeof monthlyMenuItems.$inferSelect;
export type LunchSelection = typeof lunchSelections.$inferSelect;
export type SelectionHistory = typeof selectionHistory.$inferSelect;
export type InsertHoliday = z.infer<typeof insertHolidaySchema>;
export type Holiday = typeof holidays.$inferSelect;