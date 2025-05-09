import { pgTable, text, serial, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  emailVerified: boolean("email_verified").default(false),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

export const userRelations = relations(users, ({ many }) => ({
  links: many(links),
  categories: many(categories),
  tags: many(tags)
}));

// Link Priority enum
export const priorityEnum = pgEnum("priority", ["Low", "Medium", "High"]);

// Link Status enum
export const statusEnum = pgEnum("status", ["Pending", "Completed", "Applied", "Rejected"]);

// Link Schema
export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  favicon: text("favicon"),
  categoryId: integer("category_id").references(() => categories.id),
  notes: text("notes"),
  deadline: timestamp("deadline"),
  priority: priorityEnum("priority").default("Medium"),
  status: statusEnum("status").default("Pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const linkRelations = relations(links, ({ one, many }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id]
  }),
  category: one(categories, {
    fields: [links.categoryId],
    references: [categories.id]
  }),
  tags: many(linksTags)
}));

// Category Schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon"),
  createdAt: timestamp("created_at").defaultNow()
});

export const categoryRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id]
  }),
  links: many(links)
}));

// Tag Schema
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const tagRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id]
  }),
  linksTags: many(linksTags)
}));

// Links-Tags many-to-many relation
export const linksTags = pgTable("links_tags", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" })
});

export const linksTagsRelations = relations(linksTags, ({ one }) => ({
  link: one(links, {
    fields: [linksTags.linkId],
    references: [links.id]
  }),
  tag: one(tags, {
    fields: [linksTags.tagId],
    references: [tags.id]
  })
}));

// Reminder Schema
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  linkId: integer("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  reminderDate: timestamp("reminder_date").notNull(),
  sent: boolean("sent").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const reminderRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id]
  }),
  link: one(links, {
    fields: [reminders.linkId],
    references: [links.id]
  })
}));

// Schemas with Zod validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertLinkSchema = createInsertSchema(links).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertTagSchema = createInsertSchema(tags).omit({ id: true, createdAt: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true });

// Custom schemas
export const registerSchema = insertUserSchema.pick({
  name: true,
  email: true,
  password: true
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLink = z.infer<typeof insertLinkSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

export type User = typeof users.$inferSelect;
export type Link = typeof links.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type LinkTag = typeof linksTags.$inferSelect;

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
