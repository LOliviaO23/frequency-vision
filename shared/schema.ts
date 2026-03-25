import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const kits = pgTable("kits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  duration: integer("duration").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  frequencyHz: integer("frequency_hz").notNull(),
  frequencyType: text("frequency_type").notNull(),
  frequencyDescription: text("frequency_description").notNull(),
  featured: boolean("featured").default(false),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
});

export const insertKitSchema = createInsertSchema(kits).omit({ id: true });
export type InsertKit = z.infer<typeof insertKitSchema>;
export type Kit = typeof kits.$inferSelect;

export const affirmations = pgTable("affirmations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kitId: varchar("kit_id").notNull(),
  text: text("text").notNull(),
  orderIndex: integer("order_index").notNull(),
  displayDuration: integer("display_duration").notNull().default(25),
  visualType: text("visual_type").notNull().default("fade"),
});

export const insertAffirmationSchema = createInsertSchema(affirmations).omit({ id: true });
export type InsertAffirmation = z.infer<typeof insertAffirmationSchema>;
export type Affirmation = typeof affirmations.$inferSelect;

export const kitVisuals = pgTable("kit_visuals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  label: text("label").notNull(),
});

export const insertKitVisualSchema = createInsertSchema(kitVisuals).omit({ id: true });
export type InsertKitVisual = z.infer<typeof insertKitVisualSchema>;
export type KitVisual = typeof kitVisuals.$inferSelect;

export const visionBoardImages = pgTable("vision_board_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kitId: varchar("kit_id").notNull(),
  imageUrl: text("image_url").notNull(),
  label: text("label").notNull(),
  orderIndex: integer("order_index").notNull(),
});

export const insertVisionBoardImageSchema = createInsertSchema(visionBoardImages).omit({ id: true });
export type InsertVisionBoardImage = z.infer<typeof insertVisionBoardImageSchema>;
export type VisionBoardImage = typeof visionBoardImages.$inferSelect;

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  kitId: varchar("kit_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const categories = [
  "abundance",
  "health",
  "love",
  "confidence",
  "peace",
  "success",
  "freedom",
  "manifestation",
] as const;

export type Category = typeof categories[number];

export const categoryLabels: Record<Category, string> = {
  abundance: "Wealth & Abundance",
  health: "Health & Wellness",
  love: "Love & Relationships",
  confidence: "Confidence & Growth",
  peace: "Inner Peace & Calm",
  success: "Success & Career",
  freedom: "Freedom & Recovery",
  manifestation: "Manifestation & Dreams",
};

export const fvSubscriptions = pgTable("fv_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  email: text("email").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  planType: text("plan_type").notNull(),
  status: text("status").notNull().default("active"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(fvSubscriptions).omit({ id: true, createdAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof fvSubscriptions.$inferSelect;

export { conversations, messages } from "./models/chat";
export type { Conversation, InsertConversation, Message, InsertMessage } from "./models/chat";

export const influencerContacts = pgTable("influencer_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  platform: text("platform").notNull(),
  niche: text("niche").notNull(),
  socialHandle: text("social_handle"),
  status: text("status").notNull().default("not_contacted"),
  notes: text("notes"),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInfluencerContactSchema = createInsertSchema(influencerContacts).omit({ id: true, createdAt: true });
export type InsertInfluencerContact = z.infer<typeof insertInfluencerContactSchema>;
export type InfluencerContact = typeof influencerContacts.$inferSelect;

export const INFLUENCER_NICHES = ["Life Coach", "Spiritual Influencer", "Healing Platform", "Wellness Brand"] as const;
export type InfluencerNiche = typeof INFLUENCER_NICHES[number];

export const INFLUENCER_STATUSES = ["not_contacted", "emailed", "responded", "partnership_active", "declined"] as const;
export type InfluencerStatus = typeof INFLUENCER_STATUSES[number];

export const categoryColors: Record<Category, string> = {
  abundance: "from-amber-500 to-yellow-600",
  health: "from-emerald-500 to-teal-600",
  love: "from-pink-500 to-rose-600",
  confidence: "from-violet-500 to-purple-600",
  peace: "from-indigo-500 to-blue-600",
  success: "from-orange-500 to-amber-600",
  freedom: "from-cyan-500 to-sky-600",
  manifestation: "from-fuchsia-500 to-pink-600",
};
