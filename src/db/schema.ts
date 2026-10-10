import { pgTable, uuid, varchar, text, boolean, integer, timestamp, index } from "drizzle-orm/pg-core";

export const services = pgTable("directory_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  area: varchar("area", { length: 80 }).notNull(),
  address: varchar("address", { length: 240 }).notNull().default(""),
  phone: varchar("phone", { length: 24 }).notNull(),
  phoneSecondary: varchar("phone_secondary", { length: 24 }).notNull().default(""),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  verified: boolean("verified").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  emergency: boolean("emergency").notNull().default(false),
  demo: boolean("demo").notNull().default(false),
  rating: varchar("rating", { length: 8 }).notNull().default("0"),
  reviews: integer("reviews").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("directory_services_status_idx").on(table.status)]);

export const directoryCategories = pgTable("directory_categories", {
  id: varchar("id", { length: 60 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  parentId: varchar("parent_id", { length: 60 }),
  description: varchar("description", { length: 240 }).notNull().default(""),
  color: varchar("color", { length: 7 }).notNull().default("#0876e1"),
  icon: varchar("icon", { length: 40 }).notNull().default("Wrench"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const directoryAreas = pgTable("directory_areas", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const members = pgTable("directory_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  username: varchar("username", { length: 40 }).notNull().unique(),
  phone: varchar("phone", { length: 24 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memberSessions = pgTable("directory_member_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("directory_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 20 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  message: varchar("message", { length: 300 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }).notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("directory_notifications_read_idx").on(table.read)]);

export const directorySettings = pgTable("directory_settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value").notNull(),
});

export const adminSessions = pgTable("directory_admin_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
