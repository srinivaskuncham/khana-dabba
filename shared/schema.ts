import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});

export const kids = pgTable("kids", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  school: text("school").notNull(),
  rollNumber: text("roll_number").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const usersRelations = relations(users, ({ many }) => ({
  kids: many(kids),
}));

export const kidsRelations = relations(kids, ({ one }) => ({
  user: one(users, {
    fields: [kids.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const insertKidSchema = createInsertSchema(kids);
export const insertMenuItemSchema = createInsertSchema(menuItems);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertKid = z.infer<typeof insertKidSchema>;
export type User = typeof users.$inferSelect;
export type Kid = typeof kids.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;