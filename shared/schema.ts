import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "completed", "cancelled"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["pending", "negotiating", "approved", "rejected", "completed"]);
export const depositStatusEnum = pgEnum("deposit_status", ["pending", "approved", "rejected"]);
export const cryptoCoinEnum = pgEnum("crypto_coin", ["BTC", "ETH", "USDT"]);
export const messageTypeEnum = pgEnum("message_type", ["booking", "campaign"]);
export const messageSenderEnum = pgEnum("message_sender", ["user", "admin"]);
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  country: varchar("country"),
  balanceUsd: decimal("balance_usd", { precision: 12, scale: 2 }).default("0.00").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  status: varchar("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Celebrities table
export const celebrities = pgTable("celebrities", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  priceUsd: decimal("price_usd", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  bio: text("bio"),
  status: varchar("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  celebrityId: integer("celebrity_id").notNull().references(() => celebrities.id),
  priceUsd: decimal("price_usd", { precision: 12, scale: 2 }).notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  eventDate: timestamp("event_date"),
  eventDetails: text("event_details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  celebrityId: integer("celebrity_id").notNull().references(() => celebrities.id),
  customPriceUsd: decimal("custom_price_usd", { precision: 12, scale: 2 }),
  campaignType: varchar("campaign_type", { length: 100 }).notNull(),
  description: text("description"),
  status: campaignStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  threadId: varchar("thread_id", { length: 100 }).notNull(),
  threadType: messageTypeEnum("thread_type").notNull(),
  referenceId: integer("reference_id").notNull(),
  sender: messageSenderEnum("sender").notNull(),
  senderUserId: varchar("sender_user_id").references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Deposits table
export const deposits = pgTable("deposits", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  coin: cryptoCoinEnum("coin").notNull(),
  cryptoAmountExpected: decimal("crypto_amount_expected", { precision: 18, scale: 8 }).notNull(),
  walletAddress: varchar("wallet_address", { length: 500 }),
  txHash: varchar("tx_hash", { length: 500 }),
  status: depositStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin logs table
export const adminLogs = pgTable("admin_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Settings table for crypto wallet addresses
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: varchar("key", { length: 100 }).unique().notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  campaigns: many(campaigns),
  deposits: many(deposits),
  notifications: many(notifications),
}));

export const celebritiesRelations = relations(celebrities, ({ many }) => ({
  bookings: many(bookings),
  campaigns: many(campaigns),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  celebrity: one(celebrities, { fields: [bookings.celebrityId], references: [celebrities.id] }),
}));

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  user: one(users, { fields: [campaigns.userId], references: [users.id] }),
  celebrity: one(celebrities, { fields: [campaigns.celebrityId], references: [celebrities.id] }),
}));

export const depositsRelations = relations(deposits, ({ one }) => ({
  user: one(users, { fields: [deposits.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(notifications, { fields: [notifications.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCelebritySchema = createInsertSchema(celebrities).omit({ id: true, createdAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertDepositSchema = createInsertSchema(deposits).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({ id: true, createdAt: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true, updatedAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Celebrity = typeof celebrities.$inferSelect;
export type InsertCelebrity = z.infer<typeof insertCelebritySchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Extended types with relations
export type BookingWithDetails = Booking & {
  user: User;
  celebrity: Celebrity;
};

export type CampaignWithDetails = Campaign & {
  user: User;
  celebrity: Celebrity;
};

export type DepositWithUser = Deposit & {
  user: User;
};
