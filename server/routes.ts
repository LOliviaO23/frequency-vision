import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

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
