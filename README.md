# 📰 Portfolio News Bot

ระบบ Daily Portfolio News Monitoring สำหรับผู้ใช้คนเดียว  
**ไม่ใช่ระบบซื้อขาย — เป็นระบบติดตามข่าวเท่านั้น**

---

## 1. โปรเจกต์นี้ทำอะไร

- ทำงานทุกวันในช่วง **08:00–08:59 น. เวลาไทย** ผ่าน Vercel Cron
- ดึงข่าวการเงิน/เศรษฐกิจจาก RSS feeds ที่น่าเชื่อถือ
- กรองเฉพาะข่าวที่เกี่ยวข้องกับสินทรัพย์ในพอร์ต
- วิเคราะห์ผ่าน Claude Haiku (หรือ rule-based fallback)
- ส่ง Daily Portfolio Brief ภาษาไทยเข้า Discord

**Portfolio ที่ติดตาม:**
- SCB Fund Click: SCBSP500E, SCBNASDAQ100E, SCBWORLDE, SCBGOLDE
- Webull: NVDA
- EA Bot ×2: XAUUSD (event risk monitoring)

**⚠️ ข้อสำคัญ:**
- สถานะ 🟢🟡🔴 สะท้อนสภาพแวดล้อมของข่าว/ปัจจัย ไม่ใช่คำแนะนำการลงทุน
- ระดับ LOW/MEDIUM/HIGH สำหรับ XAUUSD หมายถึง event/volatility risk เท่านั้น ไม่ใช่ทิศทางราคา

---

## 2. Architecture

```
RSS Feeds (Reuters, CNBC, Fed, NVIDIA, etc.)
        ↓
   Aggregation (แต่ละ source ล้มเหลวได้อิสระ)
        ↓
   Deduplication (URL + title hash + similarity)
        ↓
   Relevance + Materiality Filter
        ↓
   Impact Engine (news → asset → transmission mechanism)
        ↓
   Claude Haiku (max 20 articles, 1 call/day)
        ↓ หรือ fallback หาก AI ล้ม
   TypeScript Discord Formatter
        ↓
   Discord Webhook
```

---

## 3. วิธีติดตั้ง

```bash
git clone <repo>
cd portfolio-news-bot
npm install
```

---

## 4. วิธีตั้ง .env

```bash
cp .env.example .env.local
```

แก้ไขไฟล์ `.env.local`:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
CRON_SECRET=<strong-random-secret>
ANTHROPIC_API_KEY=sk-ant-...
```

**หมายเหตุ:** `NEWS_API_KEY` ไม่จำเป็นสำหรับ production

---

## 5. วิธีสร้าง Discord Webhook

1. เปิด Discord Server ของคุณ
2. ไปที่ **Server Settings → Integrations → Webhooks**
3. คลิก **New Webhook**
4. เลือก channel ที่ต้องการรับข้อความ
5. คัดลอก **Webhook URL**
6. ใส่ใน `DISCORD_WEBHOOK_URL=`

---

## 6. วิธีรัน Local

```bash
npm run dev
```

เซิร์ฟเวอร์จะทำงานที่ `http://localhost:3000`

---

## 7. วิธีทดสอบ Discord

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  http://localhost:3000/api/test-discord
```

หรือบน PowerShell:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test-discord" `
  -Headers @{ Authorization = "Bearer <CRON_SECRET>" }
```

ถ้าสำเร็จจะได้รับข้อความ test ใน Discord channel ที่ตั้งไว้

---

## 8. วิธีทดสอบ Daily Brief แบบ Manual

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  http://localhost:3000/api/daily-brief
```

---

## 9. วิธี Deploy Vercel

```bash
npm install -g vercel
vercel
```

ตั้ง environment variables ใน Vercel Dashboard:
1. ไปที่ **Project → Settings → Environment Variables**
2. เพิ่มทุกค่าจาก `.env.example` ที่จำเป็น
3. **สำคัญ:** อย่าใส่ prefix `NEXT_PUBLIC_` สำหรับ secret ใดๆ

---

## 10. วิธีตั้ง Vercel Cron

`vercel.json` ตั้งไว้แล้ว:

```json
{
  "crons": [{ "path": "/api/daily-brief", "schedule": "0 1 * * *" }]
}
```

- `0 1 * * *` = **01:00 UTC = 08:00 Asia/Bangkok (UTC+7)**
- ประเทศไทยไม่มี DST — offset คงที่ +7 ชั่วโมงตลอดปี
- **Vercel Hobby Plan:** การทำงานจะเกิดขึ้นภายในชั่วโมงที่กำหนด ไม่รับประกันว่าจะทำงานที่ 08:00:00 น. พอดี  
  ช่วงเวลาที่คาดหวัง: **08:00–08:59 ICT**

---

## 11. วิธีตรวจ Logs

**Vercel Dashboard:**
1. ไปที่ Project → **Deployments**
2. คลิก deployment ล่าสุด → **Functions**
3. เลือก `/api/daily-brief`

**Vercel CLI:**
```bash
vercel logs --follow
```

**Log format ที่คาดหวัง:**
```
[run] started
[news] articles fetched: 47
[news] after dedup: 38
[news] after filter: 14
[ai] articles sent to Claude Haiku: 14
[ai] mode: haiku
[discord] send: success (2 messages)
[run] completed
```

---

## 12. วิธีเปลี่ยน Portfolio

แก้ไขไฟล์ `lib/portfolio/definitions.ts`:
- เพิ่ม/แก้ไข `AssetDefinition` ใน array `ASSETS`
- อัปเดต `AssetKey` ใน `types/portfolio.ts`
- อัปเดต `AIBriefResponse` ใน `types/ai.ts`
- อัปเดต formatter ใน `lib/discord/formatter.ts`

---

## 13. วิธีเพิ่มหุ้นในอนาคต

1. เพิ่ม key ใหม่ใน `AssetKey` type (`types/portfolio.ts`)
2. เพิ่ม `AssetDefinition` ใน `lib/portfolio/definitions.ts`
3. เพิ่ม section ใน `lib/discord/formatter.ts`
4. อัปเดต AI prompt ใน `lib/ai/prompt.ts`
5. อัปเดต `AIBriefResponse` schema ใน `types/ai.ts` และ `lib/ai/schema.ts`

---

## 14. วิธี Rotate Discord Webhook

1. ไปที่ Discord → Server Settings → Integrations → Webhooks
2. คลิก webhook ที่ใช้อยู่ → **Regenerate** หรือลบแล้วสร้างใหม่
3. อัปเดต `DISCORD_WEBHOOK_URL` ใน Vercel Environment Variables
4. Redeploy: `vercel --prod`

---

## 15. Security Considerations

- `DISCORD_WEBHOOK_URL`, `ANTHROPIC_API_KEY`, `CRON_SECRET` เป็น secret ทั้งหมด
- ไม่เคย commit `.env` หรือ `.env.local` (`.gitignore` ป้องกันไว้แล้ว)
- Cron endpoints ป้องกันด้วย `Authorization: Bearer` header เท่านั้น
- ไม่ใส่ secret ใน query params หรือ URL path
- ไม่มี secret ปรากฏใน logs
- ไม่มี `NEXT_PUBLIC_` prefix สำหรับ secret ใดๆ
- ใช้ `timingSafeEqual` สำหรับเปรียบเทียบ token

---

## 16. ค่าใช้จ่ายโดยประมาณ

| Service | Plan | ค่าใช้จ่าย |
|---|---|---|
| Vercel | Hobby (free) | $0 |
| RSS / public sources | Free | $0 |
| Discord | Free | $0 |
| Claude Haiku API | ตามการใช้งาน | ~$2–5/เดือน |
| **รวม** | | **~$2–5/เดือน** |

ค่าใช้จ่าย Claude ขึ้นอยู่กับจำนวน token ที่ใช้จริงในแต่ละวัน  
จำกัดสูงสุด: 20 articles × ~500 tokens input + 3000 tokens output ต่อวัน

---

## Known Limitations

1. RSS feeds บางแหล่งอาจเปลี่ยนหรือหยุดให้บริการโดยไม่แจ้ง
2. Vercel Hobby ไม่รับประกันเวลาที่แน่นอน (ช่วง 08:00–08:59 ICT)
3. ไม่มีการจำข่าวจากวันก่อนหน้า (dedup ทำงานต่อ run เท่านั้น)
4. Economic calendar อาจไม่ครบถ้วน เนื่องจากไม่มี free API ที่ครอบคลุม
5. Claude อาจไม่พบ scheduled events ทั้งหมด ควรตรวจสอบ economic calendar เพิ่มเติมด้วยตนเอง
