import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // QPay Configuration
  const QPAY_CONFIG = {
    username: process.env.QPAY_USERNAME,
    password: process.env.QPAY_PASSWORD,
    invoiceReceiverCode: process.env.QPAY_INVOICE_RECEIVER_CODE,
    baseUrl: "https://merchant.qpay.mn/v2",
  };

  let qpayToken: string | null = null;
  let tokenExpiry: number = 0;

  async function getQPayToken() {
    if (qpayToken && Date.now() < tokenExpiry) {
      return qpayToken;
    }

    try {
      const auth = Buffer.from(`${QPAY_CONFIG.username}:${QPAY_CONFIG.password}`).toString("base64");
      const response = await axios.post(
        `${QPAY_CONFIG.baseUrl}/auth/token`,
        {},
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );
      qpayToken = response.data.access_token;
      tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
      return qpayToken;
    } catch (error: any) {
      console.error("QPay Auth Error:", error.response?.data || error.message);
      throw new Error("Failed to authenticate with QPay");
    }
  }

  // API Routes
  app.post("/api/qpay/invoice", async (req, res) => {
    try {
      const { amount, description, senderPhone } = req.body;
      const token = await getQPayToken();

      const invoiceData = {
        invoice_code: QPAY_CONFIG.invoiceReceiverCode,
        sender_invoice_no: `INV-${Date.now()}`,
        invoice_receiver_code: "TERMINAL",
        invoice_description: description || "Support Payment",
        amount: amount,
        callback_url: `https://${req.get("host")}/api/qpay/callback`,
      };

      const response = await axios.post(`${QPAY_CONFIG.baseUrl}/invoice`, invoiceData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      res.json(response.data);
    } catch (error: any) {
      console.error("QPay Invoice Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to create QPay invoice" });
    }
  });

  app.post("/api/qpay/check", async (req, res) => {
    try {
      const { invoice_id } = req.body;
      const token = await getQPayToken();

      const response = await axios.post(
        `${QPAY_CONFIG.baseUrl}/payment/check`,
        {
          object_type: "INVOICE",
          object_id: invoice_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error("QPay Check Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to check QPay payment" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
