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
