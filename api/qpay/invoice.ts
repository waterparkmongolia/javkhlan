import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const { QPAY_USERNAME, QPAY_PASSWORD, QPAY_API_URL, QPAY_INVOICE_CODE } = process.env;

  const { amount, description } = req.body;

  if (!QPAY_USERNAME || !QPAY_PASSWORD || !QPAY_API_URL || !QPAY_INVOICE_CODE) {
    return res.json({
      invoice_id: "MOCK-INV-" + Date.now(),
      qr_image: "https://picsum.photos/seed/qr/200",
      is_mock: true,
      amount: amount || 1000,
    });
  }

  let accessToken: string;
  try {
    const authResponse = await axios.post(`${QPAY_API_URL}/auth/token`, null, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${QPAY_USERNAME}:${QPAY_PASSWORD}`).toString("base64")}`,
      },
    });
    accessToken = authResponse.data.access_token;
    if (!accessToken) {
      return res.status(500).json({ error: "Token авахад алдаа", detail: authResponse.data });
    }
  } catch (error: any) {
    return res.status(500).json({
      error: "QPay auth алдаа",
      detail: error.response?.data || error.message,
    });
  }

  try {
    const invoiceResponse = await axios.post(
      `${QPAY_API_URL}/invoice`,
      {
        invoice_code: QPAY_INVOICE_CODE,
        sender_invoice_no: `INV-${Date.now()}`,
        invoice_receiver_code: "TERMINAL",
        invoice_description: description || "Javkhlan Payment",
        amount: amount || 1000,
        callback_url: `https://javkhlan1.vercel.app/api/qpay/callback`,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return res.json(invoiceResponse.data);
  } catch (error: any) {
    return res.status(500).json({
      error: "Invoice алдаа",
      detail: error.response?.data || error.message,
    });
  }
}
