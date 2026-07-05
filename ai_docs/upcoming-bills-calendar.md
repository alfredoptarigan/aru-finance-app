# Upcoming Bills Calendar

Dokumen kontrak API dan arah frontend untuk fitur kalender tagihan. Scope awal: tagihan dari subscription aktif.

Base path:

```text
{EXPO_PUBLIC_API_URL}/api
```

Semua endpoint butuh:

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

Wrapper response:

```ts
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: Record<string, unknown> };
```

## Goal

User bisa melihat tagihan subscription dalam kalender dan agenda upcoming bills.

Target awal:

- Month calendar dengan marker tagihan per tanggal.
- Agenda list tagihan berdasarkan tanggal.
- Summary total tagihan dalam range.
- Status `overdue`, `due_today`, atau `upcoming`.
- CTA ke subscription form/list.

Non-goal tahap awal:

- Payment settlement.
- Checklist tagihan sudah dibayar.
- Bill instance table.
- Recurring transaction non-subscription.
- Bank sync.

## Types

```ts
type UpcomingBillSource = 'subscription';
type UpcomingBillStatus = 'overdue' | 'due_today' | 'upcoming';

interface UpcomingBill {
  id: string;
  source: UpcomingBillSource;
  source_id: string;
  name: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  status: UpcomingBillStatus;
  category: string;
  icon: string;
  color: string;
  auto_debit: boolean;
  payment_method: string | null;
}

interface UpcomingBillsSummary {
  total_amount: number;
  bill_count: number;
  due_today_count: number;
  overdue_count: number;
  auto_debit_total: number;
  manual_payment_total: number;
  nearest_due: UpcomingBill | null;
}
```

`UpcomingBill.id` boleh generated deterministic:

```text
subscription:{subscription_id}:{due_date}
```

Ini cukup untuk React key dan deep link ringan tanpa menyimpan instance ke DB.

## GET /upcoming-bills

Return bill instances dalam range tanggal.

Query:

```ts
{
  start_date: string; // YYYY-MM-DD, required
  end_date: string; // YYYY-MM-DD, required
}
```

Rules:

- `start_date` dan `end_date` wajib.
- `end_date` tidak boleh sebelum `start_date`.
- Max range 93 hari.
- Hanya `subscriptions.is_active = true`.
- Sort ascending by `due_date`, lalu `name`.
- Backend expand dari `subscriptions.next_billing_date` dan `billing_cycle`.
- Tidak perlu simpan bill instance ke DB untuk tahap awal.

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "subscription:sub_123:2026-07-25",
      "source": "subscription",
      "source_id": "sub_123",
      "name": "Netflix",
      "amount": 46500,
      "due_date": "2026-07-25",
      "status": "upcoming",
      "category": "Entertainment",
      "icon": "play-circle",
      "color": "#EF4444",
      "auto_debit": true,
      "payment_method": "Rekening gaji"
    }
  ]
}
```

Error examples:

```json
{
  "success": false,
  "error": "start_date dan end_date wajib diisi"
}
```

```json
{
  "success": false,
  "error": "Range upcoming bills maksimal 93 hari"
}
```

## GET /upcoming-bills/summary

Return summary untuk hero card kalender.

Query:

```ts
{
  start_date: string; // YYYY-MM-DD, required
  end_date: string; // YYYY-MM-DD, required
}
```

Response:

```json
{
  "success": true,
  "data": {
    "total_amount": 1286500,
    "bill_count": 8,
    "due_today_count": 1,
    "overdue_count": 1,
    "auto_debit_total": 1036500,
    "manual_payment_total": 250000,
    "nearest_due": {
      "id": "subscription:sub_123:2026-07-25",
      "source": "subscription",
      "source_id": "sub_123",
      "name": "Netflix",
      "amount": 46500,
      "due_date": "2026-07-25",
      "status": "upcoming",
      "category": "Entertainment",
      "icon": "play-circle",
      "color": "#EF4444",
      "auto_debit": true,
      "payment_method": "Rekening gaji"
    }
  }
}
```

`nearest_due` adalah bill dengan `due_date >= today` terdekat. Jika semua bill dalam range overdue, isi `null`.

## Date Expansion

Backend generate occurrence dari subscription.

Input utama dari table `subscriptions`:

```text
id
name
amount
billing_cycle
next_billing_date
category
icon
color
payment_method_id
payment_method
auto_debit
is_active
```

Cycle rules:

- `weekly`: tambah 7 hari.
- `monthly`: tambah 1 bulan, pertahankan day-of-month jika bisa.
- `yearly`: tambah 1 tahun.
- Jika target month tidak punya tanggal yang sama, clamp ke akhir bulan.

Contoh clamp:

```text
2026-01-31 monthly -> 2026-02-28 -> 2026-03-31
2024-02-29 yearly -> 2025-02-28 -> 2026-02-28
```

Status rules:

```text
due_date < today  -> overdue
due_date == today -> due_today
due_date > today  -> upcoming
```

`today` dihitung dari timezone user jika backend punya `profiles.timezone`. Jika belum ada timezone profile, pakai tanggal lokal app/backend sebagai `YYYY-MM-DD` dan jangan kirim timestamp.

## Frontend UX

Route kandidat:

```text
/upcoming-bills
```

Range default:

```text
start_date = awal bulan aktif
end_date = akhir bulan aktif
```

Screen layout:

1. Header: `Bills Calendar`, month switcher, shortcut today.
2. Hero card: `Bills Radar`, total amount bulan ini, nearest due, overdue count.
3. Calendar grid: 7 columns, marker dot warna subscription di tanggal yang punya bill.
4. Selected date strip: total tagihan tanggal terpilih.
5. Agenda list: grouped by `Today`, `Tomorrow`, `This Week`, `Later`.
6. Empty state: `Belum ada tagihan bulan ini` + CTA `Tambah subscription`.

Design direction:

- Purpose: bantu user scan tanggal tagihan tanpa membuka daftar panjang.
- Audience: user personal finance yang cek app cepat, biasanya mobile.
- Tone: calm, vivid, tidak polos.
- Memorable detail: calendar date punya `bill confetti dots` kecil dari warna subscription.
- Constraint: pakai komponen existing, NativeWind, `Ionicons`, `LinearGradient`, `MotiView`; jangan tambah dependency.

Visual notes:

- Hero card pakai gradient existing, tapi copy beda dari subscription list: `Bills Radar`.
- Calendar grid jangan full putih datar. Pakai rounded date cells, selected date lebih kontras.
- Date dengan overdue pakai ring error tipis.
- Date dengan due today pakai filled accent/primary.
- Agenda card pakai icon/color subscription agar cepat dikenali.
- Badge: `Auto-debit`, `Manual`, `Overdue`, `Today`.
- Keep text pendek. Jangan jelaskan fitur di UI.

## Frontend Integration Notes

Calon perubahan frontend nanti:

- `src/types/index.ts`
  - tambah `UpcomingBill`
  - tambah `UpcomingBillsSummary`
- `src/features/upcoming-bills/hooks.ts`
  - `useUpcomingBills(startDate, endDate)`
  - `useUpcomingBillsSummary(startDate, endDate)`
- `src/app/upcoming-bills.tsx`
  - screen kalender + agenda
- `src/app/(tabs)/subscriptions.tsx`
  - CTA menuju `/upcoming-bills`

Query keys:

```ts
['upcoming-bills', startDate, endDate]
['upcoming-bills', 'summary', startDate, endDate]
```

## Backend Acceptance Criteria

- Monthly subscription `2026-07-25` muncul sekali untuk range `2026-07-01..2026-07-31`.
- Weekly subscription `2026-07-01` muncul pada `2026-07-01`, `2026-07-08`, `2026-07-15`, `2026-07-22`, `2026-07-29` untuk range Juli 2026.
- Yearly subscription `2026-07-05` muncul untuk range yang mencakup `2026-07-05`, tidak muncul untuk range Agustus 2026.
- Inactive subscription tidak muncul.
- Bill sebelum `today` punya status `overdue`.
- Bill pada `today` punya status `due_today`.
- Bill setelah `today` punya status `upcoming`.
- Summary totals sama dengan jumlah list endpoint untuk range yang sama.
- Range lebih dari 93 hari return error.

## Minimal Backend Pseudocode

```ts
function listUpcomingBills(userId, startDate, endDate) {
  validateDateRange(startDate, endDate);
  const subs = getActiveSubscriptions(userId);
  return subs
    .flatMap((sub) => expandSubscription(sub, startDate, endDate))
    .sort(byDueDateThenName);
}
```

Skipped: paid/unpaid state, stored bill instances, recurring income/expense. Add when user needs manual payment tracking or non-subscription recurring bills.
