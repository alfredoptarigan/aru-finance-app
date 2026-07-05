# Subscription Reminder & Push Notification

Dokumen implementasi fitur subscription reminder untuk frontend dan backend.

## Goal

User bisa mencatat subscription berulang dan mendapat pengingat sebelum tanggal tagihan.

Target production:

- Daftar subscription aktif.
- Total biaya subscription per bulan.
- Reminder H-1 dan hari H.
- Push notification membuka detail subscription.
- Backend mencegah reminder terkirim double.

## Frontend Stack

App saat ini menggunakan:

- Expo `56`
- Expo Router
- React Native `0.85`
- React `19`
- TypeScript
- NativeWind
- React Query
- Zustand
- Zod
- `expo-linear-gradient`
- `@expo/vector-icons`
- `@react-native-community/datetimepicker`

File subscription saat ini:

- `src/app/(tabs)/subscriptions.tsx`
- `src/app/subscription-form.tsx`
- `src/features/subscriptions/hooks.ts`
- `src/types/index.ts`

## Frontend Data Model

```ts
type SubscriptionBillingCycle = 'weekly' | 'monthly' | 'yearly';

interface Subscription {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  amount: number;
  billing_cycle: SubscriptionBillingCycle;
  next_billing_date: string;
  category: string;
  icon: string;
  color: string;
  payment_method?: string | null;
  auto_debit: boolean;
  is_active: boolean;
  reminder_days_before: number[];
  created_at: string;
  updated_at: string;
}
```

Default reminder:

```json
[1, 0]
```

Artinya H-1 dan hari H.

## Frontend Screens

### Subscription List

Route:

```text
/(tabs)/subscriptions
```

Isi UI:

- Monthly burn.
- Active subscriptions count.
- Nearest due date.
- Upcoming bills.
- Floating add button.

Backend data:

```text
GET /api/subscriptions
GET /api/subscriptions/summary
```

### Subscription Form

Route:

```text
/subscription-form
```

Fields:

- `name`
- `description`
- `amount`
- `billing_cycle`
- `next_billing_date`
- `category`
- `payment_method`
- `auto_debit`
- `is_active`
- `reminder_days_before`

Backend:

```text
POST /api/subscriptions
PUT /api/subscriptions/:id
```

## Push Permission UX

Jangan minta permission saat app pertama dibuka.

Minta permission saat user:

- Membuka subscription page pertama kali, atau
- Mengaktifkan reminder, atau
- Menyimpan subscription dengan reminder aktif.

Jika permission ditolak:

- Subscription tetap disimpan.
- Home dan Subscription page tetap menampilkan in-app due reminder.
- Tampilkan opsi buka Settings nanti.

## Push Provider

Gunakan Expo Push Notifications untuk scope ini.

Frontend butuh:

- `expo-notifications`
- request permission
- get Expo push token
- kirim token ke backend
- handle tap notification

Flow:

```text
Expo app -> Expo push token -> backend -> Expo Push API -> APNs/FCM -> device
```

## Backend Requirements

Backend wajib punya:

- CRUD subscription.
- Device push token registry.
- Scheduled job harian.
- Push notification sender.
- Reminder log untuk idempotency.
- Billing date roll-forward.

## Required Tables

### subscriptions

```sql
id uuid primary key
user_id uuid not null
name text not null
description text
amount numeric not null
billing_cycle text not null
next_billing_date date not null
category text not null
icon text
color text
payment_method_id uuid
auto_debit boolean not null default false
is_active boolean not null default true
reminder_days_before int[] not null default '{1,0}'
auto_create_transaction boolean not null default false
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

### notification_devices

```sql
id uuid primary key
user_id uuid not null
provider text not null default 'expo'
token text not null
platform text not null -- ios | android
device_id text
is_active boolean not null default true
last_seen_at timestamptz not null default now()
created_at timestamptz not null default now()
```

Unique key:

```sql
unique(user_id, provider, token)
```

### subscription_reminder_logs

```sql
id uuid primary key
subscription_id uuid not null
user_id uuid not null
reminder_date date not null
days_before int not null
status text not null -- sent | failed | skipped
provider text not null
error text
sent_at timestamptz
created_at timestamptz not null default now()
```

Unique key:

```sql
unique(subscription_id, reminder_date, days_before)
```

Ini mencegah duplicate notification.

## API Endpoints

### Subscription

```text
GET /api/subscriptions
GET /api/subscriptions/:id
POST /api/subscriptions
PUT /api/subscriptions/:id
DELETE /api/subscriptions/:id
PATCH /api/subscriptions/:id/toggle
GET /api/subscriptions/summary
```

### Notification Device

```text
POST /api/notification-devices
DELETE /api/notification-devices/:id
```

Register request:

```json
{
  "provider": "expo",
  "token": "ExponentPushToken[xxxx]",
  "platform": "ios",
  "device_id": "optional-device-id"
}
```

## Scheduled Jobs

### sendSubscriptionReminders

Run daily, ideally jam 08:00 user timezone.

MVP fallback:

```text
Asia/Jakarta
```

Logic:

```text
today = local date
find active subscriptions
where next_billing_date - today is in reminder_days_before

for each subscription:
  check subscription_reminder_logs
  skip if already sent
  get active notification_devices
  send push
  write log
```

### rollForwardSubscriptionBillingDates

Run daily after reminder job.

Logic:

```text
find active subscriptions where next_billing_date < today
advance next_billing_date by billing_cycle
```

Cycle:

- weekly: add 7 days
- monthly: add 1 month
- yearly: add 1 year

## Notification Payload

H-1:

```json
{
  "title": "Besok ada tagihan Netflix",
  "body": "Rp46.500 akan ditagih dari Rekening gaji.",
  "data": {
    "type": "subscription_reminder",
    "subscription_id": "sub_123"
  }
}
```

Hari H:

```json
{
  "title": "Netflix jatuh tempo hari ini",
  "body": "Cek pembayaranmu atau catat sebagai pengeluaran.",
  "data": {
    "type": "subscription_reminder",
    "subscription_id": "sub_123"
  }
}
```

Amount wajib tampil di push notification supaya user langsung tahu besar tagihan.

## Provider API

### Expo Push API

```text
POST https://exp.host/--/api/v2/push/send
```

Payload:

```json
{
  "to": "ExponentPushToken[xxxx]",
  "title": "Besok ada tagihan Netflix",
  "body": "Rp46.500 akan ditagih dari Rekening gaji.",
  "data": {
    "type": "subscription_reminder",
    "subscription_id": "sub_123"
  }
}
```

## Recommended Phases

### Phase 1: API

- Create `subscriptions` table.
- Add CRUD endpoints.
- Replace frontend mock with API calls.
- Keep in-app due soon reminder.

### Phase 2: Push Token

- Add `notification_devices` table.
- Add token registration endpoint.
- Add frontend permission prompt.
- Register push token after reminder opt-in.

### Phase 3: Reminder Job

- Add `subscription_reminder_logs`.
- Add daily scheduled job.
- Send Expo push notification.
- Add idempotency check.

### Phase 4: Polish

- Notification tap opens subscription detail.
- User can choose reminder days.
- Amount tampil di push notification.
- Optional auto-create expense on due date.

## Default Product Decisions

- Default reminders: `[1, 0]`.
- Default provider: Expo Push Notifications.
- Default fallback timezone: `Asia/Jakarta`.
- Keep in-app due soon card even if notification permission denied.

## Next.js Backend: Vercel Cron Tutorial

Backend stack: Next.js deployed on Vercel.

Cron goal:

```text
Daily at 08:00 WIB
-> find due subscriptions
-> send Expo Push Notification
-> write reminder log
-> roll forward expired billing dates
```

Vercel Cron uses UTC. Use this schedule:

```text
0 1 * * *
```

`01:00 UTC` = `08:00 WIB`.

Vercel Hobby plan is enough because subscription reminder only needs one daily run. Hobby timing can run within the hour, so `08:00-08:59 WIB` is expected.

## Backend Environment Variables

Set in Vercel Project Settings:

```text
CRON_SECRET=long-random-secret
EXPO_PUSH_URL=https://exp.host/--/api/v2/push/send
DATABASE_URL=your-db-url
```

`CRON_SECRET` protects cron route from public access.

## Vercel Cron Config

Create `vercel.json` in backend root:

```json
{
  "crons": [
    {
      "path": "/api/cron/subscription-reminders",
      "schedule": "0 1 * * *"
    }
  ]
}
```

## Next.js Route

For App Router, create:

```text
app/api/cron/subscription-reminders/route.ts
```

Route skeleton:

```ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const data = await runSubscriptionReminderJob();

  return NextResponse.json({ success: true, data });
}
```

Vercel Cron otomatis mengirim `CRON_SECRET` sebagai header `Authorization: Bearer <CRON_SECRET>`. Jangan taruh secret di query string.

## Job Implementation

```ts
async function runSubscriptionReminderJob() {
  const today = getJakartaDate();
  const dueSubscriptions = await getDueSubscriptions(today);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const subscription of dueSubscriptions) {
    const daysBefore = daysUntil(subscription.next_billing_date, today);

    if (await hasReminderLog(subscription.id, today, daysBefore)) {
      skipped += 1;
      continue;
    }

    const devices = await getActiveExpoDevices(subscription.user_id);

    if (devices.length === 0) {
      await createReminderLog(subscription, today, daysBefore, 'skipped', 'No active device');
      skipped += 1;
      continue;
    }

    try {
      await sendExpoPush(
        devices.map((device) => device.token),
        buildReminderMessage(subscription, daysBefore),
      );
      await createReminderLog(subscription, today, daysBefore, 'sent');
      sent += 1;
    } catch (error) {
      await createReminderLog(subscription, today, daysBefore, 'failed', String(error));
      failed += 1;
    }
  }

  await rollForwardExpiredSubscriptions(today);

  return { sent, skipped, failed };
}
```

## Date Helpers

Use `Asia/Jakarta` business date.

```ts
function getJakartaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function daysUntil(nextBillingDate: string, today: string) {
  const start = new Date(`${today}T00:00:00+07:00`).getTime();
  const end = new Date(`${nextBillingDate}T00:00:00+07:00`).getTime();
  return Math.round((end - start) / 86_400_000);
}
```

## Due Subscription Query

SQL idea:

```sql
select *
from subscriptions
where is_active = true
and (next_billing_date - :today)::int = any(reminder_days_before);
```

Prisma-safe simple approach:

```ts
async function getDueSubscriptions(today: string) {
  const maxDate = new Date(`${today}T00:00:00+07:00`);
  maxDate.setDate(maxDate.getDate() + 30);

  const candidates = await db.subscription.findMany({
    where: {
      is_active: true,
      next_billing_date: {
        gte: today,
        lte: maxDate.toISOString().slice(0, 10),
      },
    },
  });

  return candidates.filter((subscription) =>
    subscription.reminder_days_before.includes(daysUntil(subscription.next_billing_date, today)),
  );
}
```

## Expo Push Sender

```ts
async function sendExpoPush(tokens: string[], message: { title: string; body: string; data: object }) {
  const payload = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title: message.title,
    body: message.body,
    data: message.data,
  }));

  const res = await fetch(process.env.EXPO_PUSH_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Expo push failed: ${res.status}`);
  }

  return res.json();
}
```

## Notification Message

Amount wajib muncul di push notification.

```ts
function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildReminderMessage(subscription: Subscription, daysBefore: number) {
  const amount = formatIDR(subscription.amount);

  if (daysBefore === 0) {
    return {
      title: `${subscription.name} jatuh tempo hari ini`,
      body: `${amount} perlu dibayar hari ini.`,
      data: {
        type: 'subscription_reminder',
        subscription_id: subscription.id,
      },
    };
  }

  if (daysBefore === 1) {
    return {
      title: `Besok ada tagihan ${subscription.name}`,
      body: `${amount} akan jatuh tempo besok.`,
      data: {
        type: 'subscription_reminder',
        subscription_id: subscription.id,
      },
    };
  }

  return {
    title: `${subscription.name} jatuh tempo dalam ${daysBefore} hari`,
    body: `Siapkan ${amount} untuk tagihan ini.`,
    data: {
      type: 'subscription_reminder',
      subscription_id: subscription.id,
    },
  };
}
```

## Reminder Log

Use unique key:

```sql
unique(subscription_id, reminder_date, days_before)
```

Check before sending:

```ts
async function hasReminderLog(subscriptionId: string, today: string, daysBefore: number) {
  const log = await db.subscriptionReminderLog.findUnique({
    where: {
      subscription_id_reminder_date_days_before: {
        subscription_id: subscriptionId,
        reminder_date: today,
        days_before: daysBefore,
      },
    },
  });

  return !!log;
}
```

Create log:

```ts
async function createReminderLog(
  subscription: Subscription,
  today: string,
  daysBefore: number,
  status: 'sent' | 'failed' | 'skipped',
  error?: string,
) {
  await db.subscriptionReminderLog.create({
    data: {
      subscription_id: subscription.id,
      user_id: subscription.user_id,
      reminder_date: today,
      days_before: daysBefore,
      status,
      provider: 'expo',
      error,
      sent_at: status === 'sent' ? new Date() : null,
    },
  });
}
```

## Roll Forward Billing Date

```ts
async function rollForwardExpiredSubscriptions(today: string) {
  const expired = await db.subscription.findMany({
    where: {
      is_active: true,
      next_billing_date: { lt: today },
    },
  });

  for (const subscription of expired) {
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        next_billing_date: nextBillingDate(
          subscription.next_billing_date,
          subscription.billing_cycle,
        ),
      },
    });
  }
}

function nextBillingDate(date: string, cycle: 'weekly' | 'monthly' | 'yearly') {
  const next = new Date(`${date}T00:00:00+07:00`);

  if (cycle === 'weekly') next.setDate(next.getDate() + 7);
  if (cycle === 'monthly') next.setMonth(next.getMonth() + 1);
  if (cycle === 'yearly') next.setFullYear(next.getFullYear() + 1);

  return next.toISOString().slice(0, 10);
}
```

## Backend Checklist

1. Add `CRON_SECRET`, `EXPO_PUSH_URL`, and DB env in Vercel.
2. Add `vercel.json` cron config.
3. Add `app/api/cron/subscription-reminders/route.ts`.
4. Implement `runSubscriptionReminderJob`.
5. Query active subscriptions due by `reminder_days_before`.
6. Check `subscription_reminder_logs` before sending.
7. Query active Expo tokens from `notification_devices`.
8. Send Expo Push with amount visible.
9. Insert reminder log.
10. Roll forward expired billing dates.
11. Test route manually.
12. Deploy and check Vercel Cron logs.

Manual test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://your-backend.vercel.app/api/cron/subscription-reminders"
```

Expected:

```json
{
  "success": true,
  "data": {
    "sent": 1,
    "skipped": 0,
    "failed": 0
  }
}
```
