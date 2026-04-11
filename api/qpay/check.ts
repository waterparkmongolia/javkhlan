import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const { QPAY_USERNAME, QPAY_PASSWORD, QPAY_API_URL } = process.env;
  const { invoice_id, is_mock } = req.body;

  if (is_mock) {
    return res.json({ invoice_status: "PAID" });
  }

  if (!QPAY_USERNAME || !QPAY_PASSWORD || !QPAY_API_URL) {
    return res.status(400).json({ error: "QPay credentials байхгүй" });
  }

  try {
    const authResponse = await axios.post(`${QPAY_API_URL}/auth/token`, null, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${QPAY_USERNAME}:${QPAY_PASSWORD}`).toString("base64")}`,
      },
    });
    const accessToken = authResponse.data.access_token;

    const checkResponse = await axios.post(
      `${QPAY_API_URL}/payment/check`,
      {
        object_type: "INVOICE",
        object_id: invoice_id,
        offset: { page_number: 1, page_limit: 100 },
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const isPaid = checkResponse.data.paid_amount > 0 || checkResponse.data.rows?.length > 0;
    return res.json({ invoice_status: isPaid ? "PAID" : "PENDING" });
  } catch (error: any) {
    return res.status(500).json({ error: "Check алдаа", detail: error.response?.data || error.message });
  }
}
