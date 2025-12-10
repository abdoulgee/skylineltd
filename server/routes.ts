import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import {
  insertCelebritySchema,
  insertBookingSchema,
  insertCampaignSchema,
  insertMessageSchema,
  insertDepositSchema,
} from "@shared/schema";
import PDFDocument from "pdfkit";

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
};

async function getCryptoPrice(coin: string): Promise<number> {
  try {
    const coinId = COINGECKO_IDS[coin];
    if (!coinId) return 1;

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );
    const data = await response.json();
    return data[coinId]?.usd || 1;
  } catch (error) {
    console.error("CoinGecko API error:", error);
    if (coin === "USDT") return 1;
    if (coin === "BTC") return 97000;
    if (coin === "ETH") return 3400;
    return 1;
  }
}

const wsClients = new Map<string, WebSocket>();
const wsAuthTokens = new Map<string, { userId: string; expires: number }>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws, req) => {
    let userId: string | null = null;

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "auth" && message.token) {
          const tokenData = wsAuthTokens.get(message.token);
          if (tokenData && tokenData.expires > Date.now()) {
            userId = tokenData.userId;
            wsClients.set(userId, ws);
            wsAuthTokens.delete(message.token);
            ws.send(JSON.stringify({ type: "auth_success" }));
          } else {
            ws.send(JSON.stringify({ type: "auth_error", message: "Invalid or expired token" }));
          }
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    });

    ws.on("close", () => {
      if (userId) {
        wsClients.delete(userId);
      }
    });
  });

  function broadcastToUser(userId: string, data: any) {
    const client = wsClients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }

  function generateWsToken(userId: string): string {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    wsAuthTokens.set(token, { userId, expires: Date.now() + 60000 });
    return token;
  }

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/auth/ws-token", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const token = generateWsToken(userId);
      res.json({ token });
    } catch (error) {
      console.error("Error generating WS token:", error);
      res.status(500).json({ message: "Failed to generate token" });
    }
  });

  app.get("/api/celebrities", async (req, res) => {
    try {
      const celebrities = await storage.getAllCelebrities();
      res.json(celebrities);
    } catch (error) {
      console.error("Error fetching celebrities:", error);
      res.status(500).json({ message: "Failed to fetch celebrities" });
    }
  });

  app.get("/api/celebrities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid celebrity ID" });
      }
      const celebrity = await storage.getCelebrity(id);
      if (!celebrity) {
        return res.status(404).json({ message: "Celebrity not found" });
      }
      res.json(celebrity);
    } catch (error) {
      console.error("Error fetching celebrity:", error);
      res.status(500).json({ message: "Failed to fetch celebrity" });
    }
  });

  app.post("/api/celebrities", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const data = insertCelebritySchema.parse(req.body);
      const celebrity = await storage.createCelebrity(data);
      
      await storage.createAdminLog({
        adminId: req.user.claims.sub,
        action: "Created celebrity",
        metadata: { celebrityId: celebrity.id, name: celebrity.name },
      });

      res.status(201).json(celebrity);
    } catch (error: any) {
      console.error("Error creating celebrity:", error);
      res.status(400).json({ message: error.message || "Failed to create celebrity" });
    }
  });

  app.patch("/api/celebrities/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const celebrity = await storage.updateCelebrity(id, req.body);
      
      await storage.createAdminLog({
        adminId: req.user.claims.sub,
        action: "Updated celebrity",
        metadata: { celebrityId: id, changes: req.body },
      });

      res.json(celebrity);
    } catch (error: any) {
      console.error("Error updating celebrity:", error);
      res.status(400).json({ message: error.message || "Failed to update celebrity" });
    }
  });

  app.delete("/api/celebrities/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCelebrity(id);
      
      await storage.createAdminLog({
        adminId: req.user.claims.sub,
        action: "Deleted celebrity",
        metadata: { celebrityId: id },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting celebrity:", error);
      res.status(400).json({ message: error.message || "Failed to delete celebrity" });
    }
  });

  app.get("/api/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === "admin") {
        const bookings = await storage.getAllBookings();
        return res.json(bookings);
      }
      
      const bookings = await storage.getBookingsByUser(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (booking.userId !== userId && user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const celebrity = await storage.getCelebrity(req.body.celebrityId);
      if (!celebrity) {
        return res.status(404).json({ message: "Celebrity not found" });
      }

      const { booking } = await storage.createBookingWithBalanceDeduction(userId, {
        userId,
        celebrityId: req.body.celebrityId,
        priceUsd: celebrity.priceUsd,
        status: "pending",
        eventDate: req.body.eventDate ? new Date(req.body.eventDate) : null,
        eventDetails: req.body.eventDetails,
      });

      await storage.createNotification({
        userId,
        title: "Booking Submitted",
        message: `Your booking request for ${celebrity.name} has been submitted.`,
        type: "booking",
        isRead: false,
      });

      broadcastToUser(userId, { type: "notification", message: "New booking created" });

      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      if (error.message === "Insufficient wallet balance") {
        return res.status(400).json({ message: error.message });
      }
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(400).json({ message: error.message || "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id/status", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const updatedBooking = await storage.updateBookingStatus(id, status);

      if (status === "cancelled" && booking.status === "pending") {
        await storage.updateUserBalance(booking.userId, parseFloat(booking.priceUsd));
      }

      await storage.createNotification({
        userId: booking.userId,
        title: "Booking Update",
        message: `Your booking has been ${status}.`,
        type: "booking",
        isRead: false,
      });

      await storage.createAdminLog({
        adminId: req.user.claims.sub,
        action: `Updated booking status to ${status}`,
        metadata: { bookingId: id },
      });

      broadcastToUser(booking.userId, { type: "booking_update", bookingId: id, status });

      res.json(updatedBooking);
    } catch (error: any) {
      console.error("Error updating booking status:", error);
      res.status(400).json({ message: error.message || "Failed to update booking" });
    }
  });

  app.get("/api/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === "admin") {
        const campaigns = await storage.getAllCampaigns();
        return res.json(campaigns);
      }
      
      const campaigns = await storage.getCampaignsByUser(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const campaign = await storage.createCampaign({
        userId,
        celebrityId: req.body.celebrityId,
        campaignType: req.body.campaignType,
        description: req.body.description,
        status: "pending",
      });

      const celebrity = await storage.getCelebrity(req.body.celebrityId);

      await storage.createNotification({
        userId,
        title: "Campaign Request Submitted",
        message: `Your campaign request for ${celebrity?.name || "celebrity"} has been submitted.`,
        type: "campaign",
        isRead: false,
      });

      res.status(201).json(campaign);
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      res.status(400).json({ message: error.message || "Failed to create campaign" });
    }
  });

  app.patch("/api/campaigns/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const updatedCampaign = await storage.updateCampaign(id, req.body);

      if (req.body.status) {
        await storage.createNotification({
          userId: campaign.userId,
          title: "Campaign Update",
          message: `Your campaign status has been updated to ${req.body.status}.`,
          type: "campaign",
          isRead: false,
        });

        broadcastToUser(campaign.userId, { type: "campaign_update", campaignId: id });
      }

      await storage.createAdminLog({
        adminId: req.user.claims.sub,
        action: "Updated campaign",
        metadata: { campaignId: id, changes: req.body },
      });

      res.json(updatedCampaign);
    } catch (error: any) {
      console.error("Error updating campaign:", error);
      res.status(400).json({ message: error.message || "Failed to update campaign" });
    }
  });

  app.get("/api/crypto/prices", async (req, res) => {
    try {
      const [btc, eth, usdt] = await Promise.all([
        getCryptoPrice("BTC"),
        getCryptoPrice("ETH"),
        getCryptoPrice("USDT"),
      ]);
      res.json({ BTC: btc, ETH: eth, USDT: usdt });
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
      res.status(500).json({ message: "Failed to fetch crypto prices" });
    }
  });

  app.get("/api/settings/wallets", async (req, res) => {
    try {
      const [btcWallet, ethWallet, usdtWallet] = await Promise.all([
        storage.getSetting("wallet_btc"),
        storage.getSetting("wallet_eth"),
        storage.getSetting("wallet_usdt"),
      ]);
      res.json({
        BTC: btcWallet?.value || "",
        ETH: ethWallet?.value || "",
        USDT: usdtWallet?.value || "",
      });
    } catch (error) {
      console.error("Error fetching wallet addresses:", error);
      res.status(500).json({ message: "Failed to fetch wallet addresses" });
    }
  });

  app.get("/api/deposits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === "admin") {
        const deposits = await storage.getAllDeposits();
        return res.json(deposits);
      }
      
      const deposits = await storage.getDepositsByUser(userId);
      res.json(deposits);
    } catch (error) {
      console.error("Error fetching deposits:", error);
      res.status(500).json({ message: "Failed to fetch deposits" });
    }
  });

  app.post("/api/deposits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amountUsd, coin } = req.body;

      const price = await getCryptoPrice(coin);
      const cryptoAmount = parseFloat(amountUsd) / price;

      const walletSetting = await storage.getSetting(`wallet_${coin.toLowerCase()}`);
      const walletAddress = walletSetting?.value || `${coin}_WALLET_ADDRESS_NOT_SET`;

      const deposit = await storage.createDeposit({
        userId,
        amountUsd: amountUsd.toString(),
        coin,
        cryptoAmountExpected: cryptoAmount.toFixed(8),
        walletAddress,
        status: "pending",
      });

      await storage.createNotification({
        userId,
        title: "Deposit Initiated",
        message: `Your deposit of $${amountUsd} via ${coin} has been initiated.`,
        type: "deposit",
        isRead: false,
      });

      res.status(201).json(deposit);
    } catch (error: any) {
      console.error("Error creating deposit:", error);
      res.status(400).json({ message: error.message || "Failed to create deposit" });
    }
  });

  app.patch("/api/deposits/:id/status", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, txHash } = req.body;

      const deposit = await storage.getDeposit(id);
      if (!deposit) {
        return res.status(404).json({ message: "Deposit not found" });
      }

      if (status === "approved" && deposit.status === "pending") {
        await storage.updateUserBalance(deposit.userId, parseFloat(deposit.amountUsd));
      }

      const updatedDeposit = await storage.updateDepositStatus(id, status, txHash);

      await storage.createNotification({
        userId: deposit.userId,
        title: "Deposit Update",
        message: status === "approved" 
          ? `Your deposit of $${deposit.amountUsd} has been approved and credited.`
          : `Your deposit has been ${status}.`,
        type: "deposit",
        isRead: false,
      });

      await storage.createAdminLog({
        adminId: req.user.claims.sub,
        action: `Updated deposit status to ${status}`,
        metadata: { depositId: id, txHash },
      });

      broadcastToUser(deposit.userId, { type: "deposit_update", depositId: id, status });

      res.json(updatedDeposit);
    } catch (error: any) {
      console.error("Error updating deposit:", error);
      res.status(400).json({ message: error.message || "Failed to update deposit" });
    }
  });

  app.get("/api/messages/:threadId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { threadId } = req.params;

      if (user?.role !== "admin") {
        const [type, refIdStr] = threadId.split("-");
        const refId = parseInt(refIdStr);
        
        if (type === "booking") {
          const booking = await storage.getBooking(refId);
          if (!booking || booking.userId !== userId) {
            return res.status(403).json({ message: "Access denied to this conversation" });
          }
        } else if (type === "campaign") {
          const campaign = await storage.getCampaign(refId);
          if (!campaign || campaign.userId !== userId) {
            return res.status(403).json({ message: "Access denied to this conversation" });
          }
        }
      }

      const messages = await storage.getMessagesByThread(threadId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === "admin") {
        const threads = await storage.getAllThreads();
        return res.json(threads);
      }
      
      const threads = await storage.getThreadsForUser(userId);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching message threads:", error);
      res.status(500).json({ message: "Failed to fetch message threads" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { threadId, threadType, referenceId, text } = req.body;

      if (user?.role !== "admin") {
        if (threadType === "booking") {
          const booking = await storage.getBooking(parseInt(referenceId));
          if (!booking || booking.userId !== userId) {
            return res.status(403).json({ message: "Access denied to this conversation" });
          }
        } else if (threadType === "campaign") {
          const campaign = await storage.getCampaign(parseInt(referenceId));
          if (!campaign || campaign.userId !== userId) {
            return res.status(403).json({ message: "Access denied to this conversation" });
          }
        }
      }

      const message = await storage.createMessage({
        threadId,
        threadType,
        referenceId: parseInt(referenceId),
        sender: user?.role === "admin" ? "admin" : "user",
        senderUserId: userId,
        text,
      });

      if (user?.role === "admin") {
        let targetUserId: string | null = null;
        if (threadType === "booking") {
          const booking = await storage.getBooking(parseInt(referenceId));
          targetUserId = booking?.userId || null;
        } else if (threadType === "campaign") {
          const campaign = await storage.getCampaign(parseInt(referenceId));
          targetUserId = campaign?.userId || null;
        }
        
        if (targetUserId) {
          broadcastToUser(targetUserId, { type: "new_message", threadId, message });
        }
      } else {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "new_message", threadId, message, isFromUser: true }));
          }
        });
      }

      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      res.status(400).json({ message: error.message || "Failed to send message" });
    }
  });

  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to mark notification read" });
    }
  });

  app.post("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notifications read:", error);
      res.status(500).json({ message: "Failed to mark notifications read" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUser(id, req.body);
      
      await storage.createAdminLog({
        adminId: req.user.claims.sub,
        action: "Updated user",
        metadata: { userId: id, changes: req.body },
      });

      res.json(user);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: error.message || "Failed to update user" });
    }
  });

  app.patch("/api/admin/users/:id/balance", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      
      const user = await storage.updateUserBalance(id, parseFloat(amount));
      
      await storage.createAdminLog({
        adminId: req.user.claims.sub,
        action: "Adjusted user balance",
        metadata: { userId: id, amount },
      });

      await storage.createNotification({
        userId: id,
        title: "Balance Adjustment",
        message: `Your wallet balance has been adjusted by $${amount}.`,
        type: "wallet",
        isRead: false,
      });

      res.json(user);
    } catch (error: any) {
      console.error("Error adjusting balance:", error);
      res.status(400).json({ message: error.message || "Failed to adjust balance" });
    }
  });

  app.get("/api/admin/logs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const logs = await storage.getAdminLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });

  app.get("/api/admin/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { key, value } = req.body;
      const setting = await storage.upsertSetting(key, value);
      
      await storage.createAdminLog({
        adminId: req.user.claims.sub,
        action: "Updated setting",
        metadata: { key, value },
      });

      res.json(setting);
    } catch (error: any) {
      console.error("Error updating setting:", error);
      res.status(400).json({ message: error.message || "Failed to update setting" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const [users, celebrities, bookings, campaigns, deposits] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllCelebrities(),
        storage.getAllBookings(),
        storage.getAllCampaigns(),
        storage.getAllDeposits(),
      ]);

      const totalRevenue = deposits
        .filter(d => d.status === "approved")
        .reduce((sum, d) => sum + parseFloat(d.amountUsd), 0);

      const pendingBookings = bookings.filter(b => b.status === "pending").length;
      const pendingCampaigns = campaigns.filter(c => c.status === "pending").length;
      const pendingDeposits = deposits.filter(d => d.status === "pending").length;

      res.json({
        totalUsers: users.length,
        totalCelebrities: celebrities.length,
        totalBookings: bookings.length,
        totalCampaigns: campaigns.length,
        totalRevenue,
        pendingBookings,
        pendingCampaigns,
        pendingDeposits,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phone, country } = req.body;
      const user = await storage.updateUser(userId, { phone, country });
      res.json(user);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  app.get("/api/invoices/:type/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { type, id } = req.params;
      const userId = req.user.claims.sub;
      
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${type}-invoice-${id}.pdf`);
      doc.pipe(res);

      doc.fontSize(24).fillColor("#0A1A2F").text("SKYLINE LTD", { align: "center" });
      doc.fontSize(12).fillColor("#666").text("Premium Celebrity Booking Platform", { align: "center" });
      doc.moveDown(2);

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#00B8D4");
      doc.moveDown();

      if (type === "deposit") {
        const deposit = await storage.getDeposit(parseInt(id));
        if (!deposit || deposit.userId !== userId) {
          return res.status(404).json({ message: "Deposit not found" });
        }

        doc.fontSize(18).fillColor("#0A1A2F").text("DEPOSIT INVOICE", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).fillColor("#333")
          .text(`Invoice ID: DEP-${deposit.id}`)
          .text(`Date: ${deposit.createdAt?.toLocaleDateString()}`)
          .text(`Status: ${deposit.status.toUpperCase()}`)
          .moveDown()
          .text(`Cryptocurrency: ${deposit.coin}`)
          .text(`USD Amount: $${deposit.amountUsd}`)
          .text(`Crypto Amount: ${deposit.cryptoAmountExpected} ${deposit.coin}`)
          .moveDown()
          .text(`Wallet Address: ${deposit.walletAddress || "N/A"}`)
          .text(`Transaction Hash: ${deposit.txHash || "Pending"}`);
      } else if (type === "booking") {
        const booking = await storage.getBooking(parseInt(id));
        if (!booking || booking.userId !== userId) {
          return res.status(404).json({ message: "Booking not found" });
        }

        doc.fontSize(18).fillColor("#0A1A2F").text("BOOKING INVOICE", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).fillColor("#333")
          .text(`Invoice ID: BK-${booking.id}`)
          .text(`Date: ${booking.createdAt?.toLocaleDateString()}`)
          .text(`Status: ${booking.status.toUpperCase()}`)
          .moveDown()
          .text(`Celebrity: ${booking.celebrity.name}`)
          .text(`Category: ${booking.celebrity.category}`)
          .text(`Event Date: ${booking.eventDate?.toLocaleDateString() || "TBD"}`)
          .moveDown()
          .fontSize(14).fillColor("#F5C542").text(`Total: $${booking.priceUsd}`, { align: "right" });
      } else if (type === "campaign") {
        const campaign = await storage.getCampaign(parseInt(id));
        if (!campaign || campaign.userId !== userId) {
          return res.status(404).json({ message: "Campaign not found" });
        }

        doc.fontSize(18).fillColor("#0A1A2F").text("CAMPAIGN INVOICE", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).fillColor("#333")
          .text(`Invoice ID: CP-${campaign.id}`)
          .text(`Date: ${campaign.createdAt?.toLocaleDateString()}`)
          .text(`Status: ${campaign.status.toUpperCase()}`)
          .moveDown()
          .text(`Celebrity: ${campaign.celebrity.name}`)
          .text(`Campaign Type: ${campaign.campaignType}`)
          .text(`Description: ${campaign.description || "N/A"}`)
          .moveDown()
          .fontSize(14).fillColor("#F5C542").text(`Price: ${campaign.customPriceUsd ? `$${campaign.customPriceUsd}` : "To be negotiated"}`, { align: "right" });
      }

      doc.moveDown(3);
      doc.fontSize(10).fillColor("#999")
        .text("Thank you for choosing Skyline LTD", { align: "center" })
        .text("support@skylineltd.com | www.skylineltd.com", { align: "center" });

      doc.end();
    } catch (error) {
      console.error("Error generating invoice:", error);
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  return httpServer;
}
