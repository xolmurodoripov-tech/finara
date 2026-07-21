// api/notify.js
// Vercel serverless function. Bu fayl "notify-server" papkasi ildizida joylashtiriladi.
//
// NEGA KERAK:
// Avvalgi kodda Telegram bot tokeni brauzer tomonidagi (client-side) JavaScript ichida
// ochiq turardi. Har qanday tashrifchi "View Source" orqali tokenni ko'rib, botdan
// o'zi foydalanishi (spam yuborish, chatni to'ldirish va h.k.) mumkin edi.
//
// Bu yechimda token faqat SERVERDA, environment variable sifatida saqlanadi va
// hech qachon brauzerga yuborilmaydi.

export default async function handler(req, res) {
  // Faqat POST so'rovlarga ruxsat
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { text } = req.body || {};

    // Oddiy validatsiya: bo'sh yoki juda uzun xabarlarni rad etamiz
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ ok: false, error: 'Text is required' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ ok: false, error: 'Text too long' });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error('TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID environment variable topilmadi');
      return res.status(500).json({ ok: false, error: 'Server not configured' });
    }

    const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });

    if (!tgResponse.ok) {
      const errBody = await tgResponse.text();
      console.error('Telegram API xatosi:', errBody);
      return res.status(502).json({ ok: false, error: 'Telegram notify failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('notify.js xatosi:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
}
