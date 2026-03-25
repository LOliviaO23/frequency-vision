import { type Kit, type InsertKit, type Affirmation, type InsertAffirmation, type Order, type InsertOrder, type KitVisual, type InsertKitVisual, type VisionBoardImage, type InsertVisionBoardImage, type Subscription, type InsertSubscription, type InfluencerContact, type InsertInfluencerContact, kits, affirmations, orders, kitVisuals, visionBoardImages, fvSubscriptions, influencerContacts } from "@shared/schema";
import { db } from "./db";
import { eq, sql, ilike, or, and } from "drizzle-orm";

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

  getSubscriptionBySessionId(sessionId: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  createSubscription(sub: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;

  getAllInfluencerContacts(search?: string, niche?: string, status?: string): Promise<InfluencerContact[]>;
  getInfluencerContact(id: string): Promise<InfluencerContact | undefined>;
  createInfluencerContact(contact: InsertInfluencerContact): Promise<InfluencerContact>;
  updateInfluencerContact(id: string, data: Partial<InsertInfluencerContact>): Promise<InfluencerContact | undefined>;
  updateInfluencerStatus(id: string, status: string): Promise<InfluencerContact | undefined>;
  deleteInfluencerContact(id: string): Promise<void>;
  getInfluencerContactCount(): Promise<number>;
  seedInfluencerContacts(): Promise<void>;
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

  async getSubscriptionBySessionId(sessionId: string): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(fvSubscriptions).where(eq(fvSubscriptions.sessionId, sessionId));
    return sub;
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(fvSubscriptions).where(eq(fvSubscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return sub;
  }

  async createSubscription(sub: InsertSubscription): Promise<Subscription> {
    const [created] = await db.insert(fvSubscriptions).values(sub).returning();
    return created;
  }

  async updateSubscription(id: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updated] = await db.update(fvSubscriptions).set(data).where(eq(fvSubscriptions.id, id)).returning();
    return updated;
  }

  async getAllInfluencerContacts(search?: string, niche?: string, status?: string): Promise<InfluencerContact[]> {
    const conditions: ReturnType<typeof eq>[] = [];
    if (search) {
      const searchCondition = or(
        ilike(influencerContacts.name, `%${search}%`),
        ilike(influencerContacts.email, `%${search}%`),
        ilike(influencerContacts.platform, `%${search}%`),
        ilike(influencerContacts.socialHandle, `%${search}%`),
      );
      if (searchCondition) conditions.push(searchCondition);
    }
    if (niche) conditions.push(eq(influencerContacts.niche, niche));
    if (status) conditions.push(eq(influencerContacts.status, status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    return db.select().from(influencerContacts).where(whereClause).orderBy(influencerContacts.createdAt);
  }

  async getInfluencerContact(id: string): Promise<InfluencerContact | undefined> {
    const [contact] = await db.select().from(influencerContacts).where(eq(influencerContacts.id, id));
    return contact;
  }

  async createInfluencerContact(contact: InsertInfluencerContact): Promise<InfluencerContact> {
    const [created] = await db.insert(influencerContacts).values(contact).returning();
    return created;
  }

  async updateInfluencerContact(id: string, data: Partial<InsertInfluencerContact>): Promise<InfluencerContact | undefined> {
    const [updated] = await db.update(influencerContacts).set(data).where(eq(influencerContacts.id, id)).returning();
    return updated;
  }

  async updateInfluencerStatus(id: string, status: string): Promise<InfluencerContact | undefined> {
    const [updated] = await db.update(influencerContacts).set({ status }).where(eq(influencerContacts.id, id)).returning();
    return updated;
  }

  async deleteInfluencerContact(id: string): Promise<void> {
    await db.delete(influencerContacts).where(eq(influencerContacts.id, id));
  }

  async getInfluencerContactCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(influencerContacts);
    return Number(result[0]?.count || 0);
  }

  async seedInfluencerContacts(): Promise<void> {
    const count = await this.getInfluencerContactCount();
    if (count > 0) return;

    const contacts: InsertInfluencerContact[] = [
      { name: "MindValley", email: "partnerships@mindvalley.com", platform: "mindvalley.com", niche: "Healing Platform", socialHandle: "@mindvalley", status: "not_contacted", notes: "Premier personal growth platform with millions of students globally." },
      { name: "Tony Robbins Team", email: "partnerships@tonyrobbins.com", platform: "tonyrobbins.com", niche: "Life Coach", socialHandle: "@tonyrobbins", status: "not_contacted", notes: "World's #1 life coach. Huge audience overlap with visualization and mindset." },
      { name: "Brendon Burchard", email: "contact@brendon.com", platform: "brendon.com", niche: "Life Coach", socialHandle: "@brendonburchard", status: "not_contacted", notes: "High Performance Academy founder. Massive email list. Strong alignment with FV." },
      { name: "Joe Dispenza Community", email: "info@drjoedispenza.com", platform: "drjoedispenza.com", niche: "Healing Platform", socialHandle: "@drjoedispenza", status: "not_contacted", notes: "Neuroscience-based meditation. Audience deeply aligned with brainwave tech." },
      { name: "Gaia TV", email: "partnerships@gaia.com", platform: "gaia.com", niche: "Healing Platform", socialHandle: "@gaia", status: "not_contacted", notes: "Consciousness-focused streaming platform. Perfect audience fit for FV." },
      { name: "Lisa Nichols", email: "team@motivatingthemasses.com", platform: "motivatingthemasses.com", niche: "Life Coach", socialHandle: "@lisa_nichols", status: "not_contacted", notes: "Featured in The Secret. Powerful speaker and manifestation advocate." },
      { name: "Hay House", email: "info@hayhouse.com", platform: "hayhouse.com", niche: "Healing Platform", socialHandle: "@hayhouseinc", status: "not_contacted", notes: "Publisher for Louise Hay, Wayne Dyer. Deep wellness/healing audience." },
      { name: "Abraham-Hicks Publications", email: "info@abraham-hicks.com", platform: "abraham-hicks.com", niche: "Spiritual Influencer", socialHandle: "@abrahamhicks", status: "not_contacted", notes: "Law of Attraction originators. Massive audience for manifestation content." },
      { name: "Deepak Chopra Wellness", email: "media@deepakchopra.com", platform: "deepakchopra.com", niche: "Wellness Brand", socialHandle: "@deepakchopra", status: "not_contacted", notes: "Mind-body medicine authority. Global brand in conscious living." },
      { name: "The Chopra Center", email: "info@chopra.com", platform: "chopra.com", niche: "Healing Platform", socialHandle: "@chopracenter", status: "not_contacted", notes: "Holistic health platform. Strong wellness and meditation community." },
      { name: "Kyle Cease", email: "kyle@kylecease.com", platform: "kylecease.com", niche: "Life Coach", socialHandle: "@kylecease", status: "not_contacted", notes: "Transformational comedian turned coach. Wildly authentic and viral content." },
      { name: "Gabby Bernstein", email: "team@gabbybernstein.com", platform: "gabbybernstein.com", niche: "Spiritual Influencer", socialHandle: "@gabbybernstein", status: "not_contacted", notes: "NYT bestselling author. Spirit Junkie brand. Massive conscious female audience." },
      { name: "Michael Beckwith - Agape", email: "info@agapelive.com", platform: "agapelive.com", niche: "Spiritual Influencer", socialHandle: "@michaelbeckwith", status: "not_contacted", notes: "Featured in The Secret. Founder of Agape International. Powerful following." },
      { name: "HeartMath Institute", email: "inquiry@heartmath.org", platform: "heartmath.org", niche: "Healing Platform", socialHandle: "@heartmathinstitute", status: "not_contacted", notes: "Science of heart coherence. Deeply aligned with FV's frequency science angle." },
      { name: "Lewis Howes - School of Greatness", email: "partnerships@lewishowes.com", platform: "lewishowes.com", niche: "Wellness Brand", socialHandle: "@lewishowes", status: "not_contacted", notes: "Top podcast host. Massive reach with growth-oriented audience." },
      { name: "Marie Forleo", email: "hello@marieforleo.com", platform: "marieforleo.com", niche: "Life Coach", socialHandle: "@marieforleo", status: "not_contacted", notes: "B-School creator. Empowered women entrepreneurs. Strong personal development angle." },
      { name: "Vishen Lakhiani (personal)", email: "vishen@mindvalley.com", platform: "mindvalley.com", niche: "Life Coach", socialHandle: "@vishen", status: "not_contacted", notes: "Mindvalley founder. Direct partnership could unlock full platform access." },
      { name: "Eckhart Tolle Community", email: "media@eckharttolle.com", platform: "eckharttolle.com", niche: "Spiritual Influencer", socialHandle: "@eckharttolle", status: "not_contacted", notes: "Power of Now author. Enormous global following in conscious awareness." },
      { name: "Zen Life & Meditation", email: "hello@zenlife.co", platform: "zenlife.co", niche: "Wellness Brand", socialHandle: "@zenlife", status: "not_contacted", notes: "Mindfulness lifestyle brand. Audience interested in relaxation and mental clarity." },
      { name: "The Daily Stoic", email: "ryan@ryanholiday.net", platform: "dailystoic.com", niche: "Wellness Brand", socialHandle: "@dailystoic", status: "not_contacted", notes: "Ryan Holiday's Stoic philosophy brand. Self-improvement crossover audience." },
    ];

    for (const contact of contacts) {
      await db.insert(influencerContacts).values(contact);
    }
  }
}

export const storage = new DatabaseStorage();
