import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { insertInfluencerContactSchema, INFLUENCER_NICHES, INFLUENCER_STATUSES } from "@shared/schema";
import nodemailer from "nodemailer";
import { z } from "zod";

const influencerStatusSchema = z.enum(INFLUENCER_STATUSES);
const influencerNicheSchema = z.enum(INFLUENCER_NICHES);

const OUTREACH_TEMPLATES: Record<string, { subject: string; body: (name: string) => string }> = {
  "Life Coach": {
    subject: "Collaboration Offer: Free Mind Movie Kit for Your Community",
    body: (name: string) => `Hi ${name},

I hope this message finds you well. I'm reaching out from FrequencyVision — a platform that creates personalized digital mind movie kits using theta binaural beats, Solfeggio frequencies, and vision imagery to help people reprogram their subconscious mind and accelerate their results.

I've been following your work and I'm genuinely impressed by the transformation you create with your clients. Your approach to mindset and high performance aligns deeply with what we do — and I believe your community would absolutely love what FrequencyVision offers.

Here's what I'd love to propose:

We'd like to gift you a complimentary FrequencyVision kit — completely customized to your chosen focus area (abundance, confidence, success, or any of our other transformational categories). You pick your own affirmations, record them in your own voice, choose your personal visuals, and watch your personalized mind movie every day.

Many coaches who've used our kits tell us it becomes a core part of their own daily practice — and a natural tool they start recommending to clients.

If you love the experience and feel it would serve your audience, we'd be honored to set up an affiliate or partnership arrangement that works for you — generous commission, custom discount codes for your community, and co-branded content if you'd like.

No pressure, no strings. I just genuinely believe this will add real value to your daily practice and to the people you serve.

Would you be open to a brief call or email exchange to explore this?

Warmly,
The FrequencyVision Team
frequencyvision.com`,
  },
  "Healing Platform": {
    subject: "Partnership Opportunity: Frequency-Powered Mind Movie Kits",
    body: (name: string) => `Hi ${name},

I'm reaching out from FrequencyVision with an exciting partnership opportunity I think your audience will genuinely resonate with.

FrequencyVision creates digital mind movie kits that combine theta binaural beats, Solfeggio healing frequencies, personalized affirmations recorded in the user's own voice, and vision imagery — all designed to create deep subconscious shifts and accelerate healing, manifestation, and personal transformation.

Given your platform's focus on healing and consciousness expansion, we believe FrequencyVision aligns naturally with the work you're already doing for your community.

We'd love to send you a complimentary kit to experience firsthand. You'd:
• Choose a transformation theme (health, peace, abundance, love, and more)
• Select your personal affirmations and record them in your own voice
• Choose your vision images and build your personalized mind movie
• Experience the daily practice of watching it with healing frequencies

If it resonates — and we're confident it will — we'd be thrilled to explore a co-promotion or affiliate arrangement that introduces FrequencyVision to your community.

Our program offers competitive commissions, pre-made promotional content, and full creative flexibility in how you present it to your audience.

Would you be open to experiencing it yourself first and having a conversation from there?

With gratitude,
The FrequencyVision Team
frequencyvision.com`,
  },
  "Wellness Brand": {
    subject: "Collab Inquiry: Mind Movie Kits + Your Wellness Community",
    body: (name: string) => `Hi ${name},

Huge admirer of what you've built — your community clearly resonates with people who are serious about living well, thinking clearly, and intentionally creating the life they want.

I'm reaching out from FrequencyVision. We make personalized digital mind movie kits — think vision board meets neuroscience. Each kit uses theta binaural beats to access the subconscious, Solfeggio frequencies for deep healing resonance, and the user's own recorded voice speaking their affirmations — making it far more powerful than anything passive.

It's the kind of daily practice that your wellness-focused audience would immediately understand and love.

We'd like to gift you a full kit to experience personally — zero obligation, no catch. Just try it, see what you think.

If it becomes part of your own wellness stack (and we suspect it might), we'd love to explore what a partnership could look like — whether that's affiliate content, a sponsored feature, or a branded collaboration. We keep things flexible and creator-first.

Could we set something up to get a kit in your hands and go from there?

Looking forward to connecting,
The FrequencyVision Team
frequencyvision.com`,
  },
  "Spiritual Influencer": {
    subject: "Gift for You: Personalized Frequency Vision Kit",
    body: (name: string) => `Hi ${name},

Your work speaks to something real — the kind of inner transformation that most people only talk about but rarely actually achieve. That's why I knew I had to reach out.

I'm on the team at FrequencyVision, and we've built something I think you'll genuinely connect with: personalized mind movie kits that use theta binaural beats (to put the brain in its most receptive state), Solfeggio healing frequencies, and the user's own recorded affirmations — layered over their hand-chosen vision imagery.

The result is a deeply personal, frequency-powered vision movie that people watch daily to reprogram their subconscious beliefs and call in what they're meant to experience.

I'd love to gift you a complimentary kit — no strings, no obligation. Just an invitation to experience it yourself. Your niche is exactly the kind of aligned, conscious community that FrequencyVision was built for.

If it moves you the way we believe it will, we'd be honored to explore a collaboration — something that feels authentic to your voice and genuinely serves your followers.

Would you be open to receiving a kit and sharing your experience?

In frequency and light,
The FrequencyVision Team
frequencyvision.com`,
  },
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/kits", async (_req, res) => {
    try {
      const allKits = await storage.getAllKits();
      res.json(allKits);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/kits/:id", async (req, res) => {
    try {
      const kit = await storage.getKit(req.params.id);
      if (!kit) {
        return res.status(404).json({ message: "Kit not found" });
      }
      res.json(kit);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/kits/:id/affirmations", async (req, res) => {
    try {
      const affs = await storage.getAffirmations(req.params.id);
      res.json(affs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/kits/:id/vision-board", async (req, res) => {
    try {
      const images = await storage.getVisionBoardImages(req.params.id);
      res.json(images);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/full-kit/:id", async (req, res) => {
    try {
      const kit = await storage.getKit(req.params.id);
      if (!kit) {
        return res.status(404).json({ message: "Kit not found" });
      }
      const [kitAffirmations, visuals] = await Promise.all([
        storage.getAffirmations(req.params.id),
        storage.getVisualsByCategory(kit.category),
      ]);
      res.json({ kit, affirmations: kitAffirmations, visuals });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/visuals/:category", async (req, res) => {
    try {
      const visuals = await storage.getVisualsByCategory(req.params.category);
      res.json(visuals);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/checkout", async (req, res) => {
    try {
      const { kitId, email } = req.body;
      if (!kitId) {
        return res.status(400).json({ message: "kitId is required" });
      }

      const kit = await storage.getKit(kitId);
      if (!kit) {
        return res.status(404).json({ message: "Kit not found" });
      }

      if (!kit.stripePriceId) {
        const order = await storage.createOrder({
          email: email || "guest@frequencyvision.com",
          kitId: kit.id,
          amount: kit.price,
          status: "completed",
          stripeSessionId: null,
        });
        return res.json({ url: null, orderId: order.id, redirect: `/player/${kit.id}` });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: kit.stripePriceId, quantity: 1 }],
        mode: "payment",
        success_url: `${baseUrl}/checkout/success?kitId=${kit.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/kits/${kit.id}`,
        customer_email: email || undefined,
        metadata: {
          kitId: kit.id,
        },
      });

      const order = await storage.createOrder({
        email: email || "guest@frequencyvision.com",
        kitId: kit.id,
        amount: kit.price,
        status: "pending",
        stripeSessionId: session.id,
      });

      res.json({ url: session.url, orderId: order.id });
    } catch (err: any) {
      console.error("Checkout error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/stripe/publishable-key", async (_req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/orders/verify", async (req, res) => {
    try {
      const sessionId = req.query.session_id as string;
      if (!sessionId) {
        return res.status(400).json({ message: "session_id is required" });
      }

      const order = await storage.getOrderBySessionId(sessionId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status === "pending") {
        try {
          const stripe = await getUncachableStripeClient();
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          if (session.payment_status === "paid") {
            await storage.updateOrderStatus(order.id, "completed");
            return res.json({ ...order, status: "completed" });
          }
        } catch {
          // Stripe session check failed, return current status
        }
      }

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/subscription/record", async (req, res) => {
    try {
      const { sessionId, planType } = req.body;
      if (!sessionId || !planType) {
        return res.status(400).json({ message: "sessionId and planType are required" });
      }

      const existing = await storage.getSubscriptionBySessionId(sessionId);
      if (existing) {
        return res.json({ success: true, subscription: existing });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "customer"],
      });

      const email = session.customer_details?.email || session.customer_email || "unknown@frequencyvision.com";
      const stripeSubscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id || null;

      let currentPeriodEnd: Date | null = null;
      if (stripeSubscriptionId && planType === "annual") {
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
      }

      const sub = await storage.createSubscription({
        sessionId,
        email,
        stripeSubscriptionId,
        planType,
        status: "active",
        currentPeriodEnd,
      });

      res.json({ success: true, subscription: sub });
    } catch (err: any) {
      console.error("Subscription record error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/subscription/check", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ active: false, reason: "sessionId required" });
      }

      const sub = await storage.getSubscriptionBySessionId(sessionId);
      if (!sub) {
        return res.json({ active: false, reason: "not_found" });
      }

      if (sub.planType === "lifetime") {
        return res.json({ active: true, plan: "lifetime" });
      }

      if (!sub.stripeSubscriptionId) {
        return res.json({ active: false, reason: "no_subscription_id" });
      }

      const stripe = await getUncachableStripeClient();
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);

      const isActive = stripeSub.status === "active" || stripeSub.status === "trialing";
      const expiresAt = new Date(stripeSub.current_period_end * 1000);
      const newStatus = isActive ? "active" : (stripeSub.status === "canceled" ? "canceled" : "expired");

      if (newStatus !== sub.status || expiresAt.toISOString() !== sub.currentPeriodEnd?.toISOString()) {
        await storage.updateSubscription(sub.id, {
          status: newStatus,
          currentPeriodEnd: expiresAt,
        });
      }

      res.json({
        active: isActive,
        plan: "annual",
        expiresAt: expiresAt.toISOString(),
        status: stripeSub.status,
      });
    } catch (err: any) {
      console.error("Subscription check error:", err);
      res.status(500).json({ active: false, reason: "error", message: err.message });
    }
  });

  app.post("/api/checkout/subscription", async (req, res) => {
    try {
      const { email } = req.body;
      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const products = await stripe.products.search({
        query: 'name:"FrequencyVision Annual Pass" AND active:"true"',
        limit: 1,
      });

      let productId: string;
      let priceId: string;

      if (products.data.length > 0) {
        productId = products.data[0].id;
        const prices = await stripe.prices.list({ product: productId, active: true, limit: 1 });
        priceId = prices.data[0]?.id;
      }

      if (!productId! || !priceId!) {
        const product = await stripe.products.create({
          name: "FrequencyVision Annual Pass",
          description: "Unlimited access to 4 digital vision movie kits for one full year. Build, record, and replay your personalized vision movies anytime.",
          metadata: { type: "annual_subscription" },
        });
        productId = product.id;
        const price = await stripe.prices.create({
          product: productId,
          unit_amount: 29900,
          currency: "usd",
          recurring: { interval: "year" },
        });
        priceId = price.id;
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${baseUrl}/checkout/success?subscription=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/kits`,
        customer_email: email || undefined,
        metadata: { type: "annual_subscription" },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Subscription checkout error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/checkout/vr-upgrade", async (req, res) => {
    try {
      const { kitId, email } = req.body;
      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const products = await stripe.products.search({
        query: 'name:"FrequencyVision VR Upgrade" AND active:"true"',
        limit: 1,
      });

      let productId: string;
      let priceId: string;

      if (products.data.length > 0) {
        productId = products.data[0].id;
        const prices = await stripe.prices.list({ product: productId, active: true, limit: 1 });
        priceId = prices.data[0]?.id;
      }

      if (!productId! || !priceId!) {
        const product = await stripe.products.create({
          name: "FrequencyVision VR Upgrade",
          description: "Unlock the 360° immersive VR experience for your FrequencyVision kit. Compatible with Meta Quest, Google Cardboard, and all modern browsers.",
          metadata: { type: "vr_upgrade" },
        });
        productId = product.id;
        const price = await stripe.prices.create({
          product: productId,
          unit_amount: 2900,
          currency: "usd",
        });
        priceId = price.id;
      }

      const successUrl = kitId
        ? `${baseUrl}/vr/${kitId}?vr_unlocked=true&session_id={CHECKOUT_SESSION_ID}`
        : `${baseUrl}/kits?vr_unlocked=true&session_id={CHECKOUT_SESSION_ID}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "payment",
        success_url: successUrl,
        cancel_url: kitId ? `${baseUrl}/kits/${kitId}` : `${baseUrl}/kits`,
        customer_email: email || undefined,
        metadata: { type: "vr_upgrade", kitId: kitId || "" },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("VR upgrade checkout error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/checkout/lifetime", async (req, res) => {
    try {
      const { email } = req.body;
      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const products = await stripe.products.search({
        query: 'name:"FrequencyVision Lifetime Access" AND active:"true"',
        limit: 1,
      });

      let productId: string;
      let priceId: string;

      if (products.data.length > 0) {
        productId = products.data[0].id;
        const prices = await stripe.prices.list({ product: productId, active: true, limit: 1 });
        priceId = prices.data[0]?.id;
      }

      if (!productId! || !priceId!) {
        const product = await stripe.products.create({
          name: "FrequencyVision Lifetime Access",
          description: "One-time payment for unlimited access to all current and future FrequencyVision kits, forever. Build as many personalized vision movies as you want.",
          metadata: { type: "lifetime" },
        });
        productId = product.id;
        const price = await stripe.prices.create({
          product: productId,
          unit_amount: 59900,
          currency: "usd",
        });
        priceId = price.id;
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "payment",
        success_url: `${baseUrl}/checkout/success?lifetime=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/kits`,
        customer_email: email || undefined,
        metadata: { type: "lifetime" },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Lifetime checkout error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  await storage.seedInfluencerContacts();

  app.get("/api/outreach/contacts", async (req, res) => {
    try {
      const { search, niche, status } = req.query as Record<string, string>;
      const contacts = await storage.getAllInfluencerContacts(search, niche, status);
      res.json(contacts);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/outreach/contacts", async (req, res) => {
    try {
      const parsed = insertInfluencerContactSchema.extend({
        niche: influencerNicheSchema,
        status: influencerStatusSchema.optional().default("not_contacted"),
      }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      const contact = await storage.createInfluencerContact(parsed.data);
      res.json(contact);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/outreach/contacts/:id", async (req, res) => {
    try {
      const updateSchema = insertInfluencerContactSchema.partial().extend({
        niche: influencerNicheSchema.optional(),
        status: influencerStatusSchema.optional(),
      });
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      const contact = await storage.updateInfluencerContact(req.params.id, parsed.data);
      if (!contact) return res.status(404).json({ message: "Contact not found" });
      res.json(contact);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/outreach/contacts/:id/status", async (req, res) => {
    try {
      const parsed = z.object({ status: influencerStatusSchema }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid status", errors: parsed.error.flatten() });
      }
      const contact = await storage.updateInfluencerStatus(req.params.id, parsed.data.status);
      if (!contact) return res.status(404).json({ message: "Contact not found" });
      res.json(contact);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/outreach/contacts/:id", async (req, res) => {
    try {
      await storage.deleteInfluencerContact(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/outreach/template/:contactId", async (req, res) => {
    try {
      const contact = await storage.getInfluencerContact(req.params.contactId);
      if (!contact) return res.status(404).json({ message: "Contact not found" });
      const niche = contact.niche;
      const template = OUTREACH_TEMPLATES[niche] || OUTREACH_TEMPLATES["Wellness Brand"];
      res.json({
        subject: template.subject,
        body: template.body(contact.name),
        to: contact.email,
        contactName: contact.name,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/outreach/send-email", async (req, res) => {
    try {
      const { contactId } = req.body;
      if (!contactId) return res.status(400).json({ message: "contactId is required" });

      const contact = await storage.getInfluencerContact(contactId);
      if (!contact) return res.status(404).json({ message: "Contact not found" });

      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
      if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return res.status(503).json({
          message: "Email sending is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM environment variables.",
        });
      }

      const niche = contact.niche;
      const template = OUTREACH_TEMPLATES[niche] || OUTREACH_TEMPLATES["Wellness Brand"];
      const emailBody = template.body(contact.name);
      const emailSubject = template.subject;

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || "587"),
        secure: parseInt(SMTP_PORT || "587") === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });

      await transporter.sendMail({
        from: SMTP_FROM || SMTP_USER,
        to: contact.email,
        subject: emailSubject,
        text: emailBody,
      });

      await storage.updateInfluencerContact(contactId, {
        status: "emailed",
        lastContactedAt: new Date(),
      });

      res.json({ success: true, message: `Email sent to ${contact.name} at ${contact.email}` });
    } catch (err: any) {
      console.error("Send email error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/outreach/stats", async (_req, res) => {
    try {
      const contacts = await storage.getAllInfluencerContacts();
      const stats = {
        total: contacts.length,
        emailed: contacts.filter(c => c.status === "emailed" || c.status === "responded" || c.status === "partnership_active").length,
        responded: contacts.filter(c => c.status === "responded").length,
        active: contacts.filter(c => c.status === "partnership_active").length,
      };
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/stripe/setup-products", async (_req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const allKits = await storage.getAllKits();
      const results: { kitId: string; title: string; productId: string; priceId: string }[] = [];

      for (const kit of allKits) {
        if (kit.stripeProductId && kit.stripePriceId) {
          results.push({
            kitId: kit.id,
            title: kit.title,
            productId: kit.stripeProductId,
            priceId: kit.stripePriceId,
          });
          continue;
        }

        const product = await stripe.products.create({
          name: kit.title,
          description: kit.description.substring(0, 500),
          metadata: { kitId: kit.id, category: kit.category },
        });

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: kit.price,
          currency: "usd",
        });

        await storage.updateKit(kit.id, {
          stripeProductId: product.id,
          stripePriceId: price.id,
        });

        results.push({
          kitId: kit.id,
          title: kit.title,
          productId: product.id,
          priceId: price.id,
        });
      }

      res.json({ message: `Created Stripe products for ${results.length} kits`, results });
    } catch (err: any) {
      console.error("Stripe product setup error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
