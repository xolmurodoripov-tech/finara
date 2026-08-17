// ══════════════════════════════════════════════════════════════════════
//  FINARA — /api/notify   (Vercel Serverless Function)
//  Fayl joyi:  loyiha_ildizi/api/notify.js
//
//  Sayt kodi shu manzilga POST qiladi. AGAR BU FAYL BO'LMASA, har bir
//  so'rov 404 bilan qaytadi va sayt uni JIMGINA yutib yuboradi
//  (fetch(...).catch(()=>{})) — ya'ni siz lead kelmayotganini ham
//  bilmay qolasiz. Shuning uchun bu fayl majburiy.
//
//  Vercel'da sozlash (Settings → Environment Variables):
//     TELEGRAM_BOT_TOKEN = 1234567890:AA...        (BotFather bergan token)
//     TELEGRAM_CHAT_ID   = 123456789               (@userinfobot beradi)
//  Token HECH QACHON HTML ichida bo'lmasligi kerak — u brauzerda ochiq
//  ko'rinadi va istalgan odam sizning botingizdan foydalana oladi.
// ══════════════════════════════════════════════════════════════════════

// Oddiy spam himoyasi: bitta IP dan daqiqasiga 5 tadan ko'p bo'lmasin.
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { count: 0, start: now };
  if (now - rec.start > WINDOW_MS) {
    rec.count = 0;
    rec.start = now;
  }
  rec.count += 1;
  hits.set(ip, rec);
  if (hits.size > 5000) hits.clear();          // xotira o'smasin
  return rec.count > MAX_PER_WINDOW;
}

export default async function handler(req, res) {
  // Faqat o'z saytimizdan
  const origin = req.headers.origin || '';
  const allowed = ['https://finara.uz', 'https://www.finara.uz'];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('notify: TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID sozlanmagan');
    return res.status(500).json({ error: 'Server not configured' });
  }

  let text = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    text = String((body && body.text) || '').slice(0, 3000);   // uzunlik chegarasi
  } catch {
    return res.status(400).json({ error: 'Bad JSON' });
  }
  if (!text.trim()) return res.status(400).json({ error: 'Empty text' });

  // Telegram HTML-parse rejimi uchun xavfli belgilarni tozalaymiz
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const stamp = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });
  const message = `${safe}\n\n<i>${stamp} · ${ip}</i>`;

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!tg.ok) {
      const detail = await tg.text();
      console.error('notify: Telegram xatosi', tg.status, detail);
      return res.status(502).json({ error: 'Telegram error' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('notify:', e);
    return res.status(500).json({ error: 'Send failed' });
  }
}
