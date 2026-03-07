import { type Kit, type InsertKit, type Affirmation, type InsertAffirmation, type Order, type InsertOrder, type KitVisual, type InsertKitVisual, type VisionBoardImage, type InsertVisionBoardImage, kits, affirmations, orders, kitVisuals, visionBoardImages } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getKit(id: string): Promise<Kit | undefined>;
  getAllKits(): Promise<Kit[]>;
  getKitsByCategory(category: string): Promise<Kit[]>;
  createKit(kit: InsertKit): Promise<Kit>;
  updateKit(id: string, data: Partial<InsertKit>): Promise<Kit | undefined>;

  getAffirmations(kitId: string): Promise<Affirmation[]>;
  createAffirmation(aff: InsertAffirmation): Promise<Affirmation>;

  getVisualsByCategory(category: string): Promise<KitVisual[]>;
  createVisual(visual: InsertKitVisual): Promise<KitVisual>;
  getVisualCount(): Promise<number>;
  clearAllVisuals(): Promise<void>;

  getVisionBoardImages(kitId: string): Promise<VisionBoardImage[]>;
  createVisionBoardImage(image: InsertVisionBoardImage): Promise<VisionBoardImage>;
  getVisionBoardImageCount(): Promise<number>;
  clearAllVisionBoardImages(): Promise<void>;

  getOrder(id: string): Promise<Order | undefined>;
  getOrderBySessionId(sessionId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  getKitCount(): Promise<number>;
  getAffirmationCount(): Promise<number>;
  clearAllKitsAndAffirmations(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getKit(id: string): Promise<Kit | undefined> {
    const [kit] = await db.select().from(kits).where(eq(kits.id, id));
    return kit;
  }

  async getAllKits(): Promise<Kit[]> {
    return db.select().from(kits);
  }

  async getKitsByCategory(category: string): Promise<Kit[]> {
    return db.select().from(kits).where(eq(kits.category, category));
  }

  async createKit(kit: InsertKit): Promise<Kit> {
    const [created] = await db.insert(kits).values(kit).returning();
    return created;
  }

  async updateKit(id: string, data: Partial<InsertKit>): Promise<Kit | undefined> {
    const [updated] = await db.update(kits).set(data).where(eq(kits.id, id)).returning();
    return updated;
  }

  async getAffirmations(kitId: string): Promise<Affirmation[]> {
    return db.select().from(affirmations).where(eq(affirmations.kitId, kitId)).orderBy(affirmations.orderIndex);
  }

  async createAffirmation(aff: InsertAffirmation): Promise<Affirmation> {
    const [created] = await db.insert(affirmations).values(aff).returning();
    return created;
  }

  async getVisualsByCategory(category: string): Promise<KitVisual[]> {
    return db.select().from(kitVisuals).where(eq(kitVisuals.category, category));
  }

  async createVisual(visual: InsertKitVisual): Promise<KitVisual> {
    const [created] = await db.insert(kitVisuals).values(visual).returning();
    return created;
  }

  async getVisualCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(kitVisuals);
    return Number(result[0]?.count || 0);
  }

  async clearAllVisuals(): Promise<void> {
    await db.delete(kitVisuals);
  }

  async getVisionBoardImages(kitId: string): Promise<VisionBoardImage[]> {
    return db.select().from(visionBoardImages).where(eq(visionBoardImages.kitId, kitId)).orderBy(visionBoardImages.orderIndex);
  }

  async createVisionBoardImage(image: InsertVisionBoardImage): Promise<VisionBoardImage> {
    const [created] = await db.insert(visionBoardImages).values(image).returning();
    return created;
  }

  async getVisionBoardImageCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(visionBoardImages);
    return Number(result[0]?.count || 0);
  }

  async clearAllVisionBoardImages(): Promise<void> {
    await db.delete(visionBoardImages);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderBySessionId(sessionId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.stripeSessionId, sessionId));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getKitCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(kits);
    return Number(result[0]?.count || 0);
  }

  async getAffirmationCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(affirmations);
    return Number(result[0]?.count || 0);
  }

  async clearAllKitsAndAffirmations(): Promise<void> {
    await db.delete(affirmations);
    await db.delete(kits);
  }
}

export const storage = new DatabaseStorage();
