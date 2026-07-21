# FINARA — Xavfsiz Telegram bildirishnoma serveri

Bu kichik backend Telegram bot tokenini brauzerdan yashiradi. `finara.html`
endi tokenni o'zi bilmaydi — u shu serverga (`/api/notify`) so'rov yuboradi,
server esa tokendan foydalanib Telegram'ga xabar yuboradi.

## 1-qadam: ESKI TOKENNI DARHOL BEKOR QILING

Eski token allaqachon ochiq kodda turgan edi, ya'ni uni ko'rgan har kim undan
foydalana olishi mumkin edi. Yangi serverni sozlashdan oldin:

1. Telegramda **@BotFather** ga o'ting
2. `/mybots` → botingizni tanlang → **API Token** → **Revoke current token**
3. Yangi token beriladi — shuni saqlab qo'ying (eskisi endi ishlamaydi)

## 2-qadam: Vercelga joylashtirish (bepul, ~5 daqiqa)

1. [vercel.com](https://vercel.com) da ro'yxatdan o'ting (GitHub orqali kirish qulay)
2. Shu `notify-server` papkasini GitHub repo qiling yoki to'g'ridan-to'g'ri
   Vercel CLI orqali yuklang:
   ```bash
   npm i -g vercel
   cd notify-server
   vercel
   ```
3. Vercel loyiha sozlamalarida **Environment Variables** bo'limiga o'ting va qo'shing:
   - `TELEGRAM_BOT_TOKEN` = yangi tokeningiz
   - `TELEGRAM_CHAT_ID` = `1417175918` (yoki yangi chat ID)
4. Deploy tugagach, sizga domen beriladi, masalan: `https://finara-notify.vercel.app`

## 3-qadam: finara.html faylida endpointni yangilang

`finara.html` ichida quyidagi qatorni toping:
```js
const NOTIFY_ENDPOINT = '/api/notify';
```
Agar HTML fayl **boshqa** domenda (masalan oddiy hosting yoki GitHub Pages) joylashgan bo'lsa,
to'liq URL yozing:
```js
const NOTIFY_ENDPOINT = 'https://finara-notify.vercel.app/api/notify';
```
Agar HTML faylni ham shu Vercel loyihasi ichida joylashtirsangiz (tavsiya etiladi),
`/api/notify` shundayligicha ishlayveradi.

## Muhim eslatma

Token endi hech qachon brauzer kodida ko'rinmaydi — u faqat Vercel serverida,
environment variable sifatida saqlanadi.
