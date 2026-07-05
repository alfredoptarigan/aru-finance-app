# Today / This Week Summary

Dokumen kontrak API untuk ringkasan cepat di Home. Scope awal: satu endpoint yang menggabungkan hal penting hari ini dan minggu ini.

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

User bisa membuka Home dan langsung tahu hal yang perlu diperhatikan tanpa masuk ke banyak layar.

Target awal:

- Tagihan hari ini dan tagihan terdekat minggu ini.
- Budget yang hampir habis atau sudah lewat batas.
- Progress goal aktif yang paling relevan.
- Snapshot cashflow bulan berjalan.
- List insight pendek yang bisa langsung dirender sebagai card.

Non-goal tahap awal:

- AI financial advice.
- Monthly review lengkap.
- Payment settlement.
- Checklist tagihan sudah dibayar.
- Bank sync.
- Notifikasi baru.

## Types

```ts
type SummaryItemKind = 'bill' | 'budget' | 'goal' | 'cashflow';
type SummaryItemSeverity = 'info' | 'warning' | 'danger' | 'success';

interface TodaySummary {
  date: string; // YYYY-MM-DD
  week_start: string; // YYYY-MM-DD
  week_end: string; // YYYY-MM-DD
  month: number;
  year: number;
  cashflow: CashflowSnapshot;
  bills: BillsSnapshot;
  budgets: BudgetSnapshot[];
  goals: GoalSnapshot[];
  items: SummaryItem[];
}

interface CashflowSnapshot {
  income_month_to_date: number;
  expense_month_to_date: number;
  balance_month_to_date: number;
  savings_rate: number;
}

interface BillsSnapshot {
  due_today_count: number;
  due_this_week_count: number;
  due_this_week_total: number;
  nearest_due: SummaryBill | null;
}

interface SummaryBill {
  id: string;
  source: 'subscription';
  source_id: string;
  name: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  status: 'overdue' | 'due_today' | 'upcoming';
  auto_debit: boolean;
  payment_method: string | null;
}

interface BudgetSnapshot {
  id: string;
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  limit_amount: number;
  spent_amount: number;
  usage_percent: number;
  remaining_amount: number;
}

interface GoalSnapshot {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  progress_percent: number;
  remaining_amount: number;
  deadline: string | null;
}

interface SummaryItem {
  id: string;
  kind: SummaryItemKind;
  severity: SummaryItemSeverity;
  title: string;
  subtitle: string;
  amount: number | null;
  route: string | null;
}
```

## GET /dashboard/today-summary

Return ringkasan hari ini dan minggu ini.

Query optional:

```ts
{
  date?: string; // YYYY-MM-DD, default: today
}
```

Rules:

- `date` optional, tapi jika dikirim harus format `YYYY-MM-DD`.
- `week_start` pakai Senin.
- `week_end` pakai Minggu.
- `month` dan `year` mengikuti `date`.
- Semua data harus scoped ke user dari access token.
- Sort `items` berdasarkan severity lalu kebutuhan terdekat.
- Maksimal `items` 6 agar Home tetap ringan.

Response:

```json
{
  "success": true,
  "data": {
    "date": "2026-07-05",
    "week_start": "2026-06-29",
    "week_end": "2026-07-05",
    "month": 7,
    "year": 2026,
    "cashflow": {
      "income_month_to_date": 8000000,
      "expense_month_to_date": 4200000,
      "balance_month_to_date": 3800000,
      "savings_rate": 47.5
    },
    "bills": {
      "due_today_count": 1,
      "due_this_week_count": 3,
      "due_this_week_total": 450000,
      "nearest_due": {
        "id": "subscription:sub_123:2026-07-05",
        "source": "subscription",
        "source_id": "sub_123",
        "name": "Netflix",
        "amount": 46500,
        "due_date": "2026-07-05",
        "status": "due_today",
        "auto_debit": true,
        "payment_method": "Rekening gaji"
      }
    },
    "budgets": [
      {
        "id": "budget_123",
        "category_id": "cat_food",
        "category_name": "Makanan",
        "icon": "restaurant",
        "color": "#F97316",
        "limit_amount": 2000000,
        "spent_amount": 1700000,
        "usage_percent": 85,
        "remaining_amount": 300000
      }
    ],
    "goals": [
      {
        "id": "goal_123",
        "title": "Dana Darurat",
        "target_amount": 30000000,
        "current_amount": 13800000,
        "progress_percent": 46,
        "remaining_amount": 16200000,
        "deadline": "2026-12-31"
      }
    ],
    "items": [
      {
        "id": "bill:subscription:sub_123:2026-07-05",
        "kind": "bill",
        "severity": "warning",
        "title": "1 tagihan hari ini",
        "subtitle": "Netflix jatuh tempo hari ini",
        "amount": 46500,
        "route": "/upcoming-bills"
      },
      {
        "id": "budget:budget_123",
        "kind": "budget",
        "severity": "warning",
        "title": "Budget Makanan sudah 85%",
        "subtitle": "Sisa Rp300.000 bulan ini",
        "amount": 300000,
        "route": "/(tabs)/budgets"
      }
    ]
  }
}
```

Error example:

```json
{
  "success": false,
  "error": "Format date harus YYYY-MM-DD"
}
```

## Backend Rules

Cashflow:

- Ambil transaksi dari awal bulan sampai `date`.
- `income_month_to_date`: total `type = income`.
- `expense_month_to_date`: total `type = expense`.
- `balance_month_to_date`: income minus expense.
- `savings_rate`: `(balance_month_to_date / income_month_to_date) * 100`, atau `0` jika income `0`.

Bills:

- Reuse expansion rules dari `GET /upcoming-bills`.
- Range minggu ini: `week_start` sampai `week_end`.
- `due_today_count`: bill dengan `due_date = date`.
- `due_this_week_count`: bill dalam minggu berjalan.
- `due_this_week_total`: total amount bill minggu berjalan.
- `nearest_due`: bill terdekat dengan `due_date >= date`, atau `null`.

Budgets:

- Ambil budget untuk `month` dan `year`.
- Hitung `spent_amount` dari expense kategori terkait pada bulan berjalan sampai `date`.
- `usage_percent`: `(spent_amount / limit_amount) * 100`, atau `0` jika limit `0`.
- Return hanya budget dengan `usage_percent >= 80`.
- Sort descending by `usage_percent`.
- Limit 3.

Goals:

- Ambil goal dengan `status = active`.
- Sort by deadline paling dekat, lalu progress paling rendah.
- Limit 2.
- Jika tidak ada deadline, taruh setelah goal yang punya deadline.

## Item Generation

Severity:

- `danger`: budget `usage_percent >= 100` atau bill overdue.
- `warning`: bill hari ini, bill minggu ini, atau budget `usage_percent >= 80`.
- `success`: savings rate `>= 20`.
- `info`: goal aktif atau info netral lain.

Priority:

1. Overdue bill.
2. Bill hari ini.
3. Budget lewat batas.
4. Budget hampir habis.
5. Bill terdekat minggu ini.
6. Goal dengan deadline terdekat.
7. Cashflow snapshot.

Routes:

```text
bill -> /upcoming-bills
budget -> /(tabs)/budgets
goal -> /goals
cashflow -> /insights
```

## Implementation Notes

- Tidak perlu table baru untuk tahap awal.
- Tidak perlu cache khusus; React Query frontend sudah punya `staleTime`.
- Endpoint ini aman dibuat dari query agregasi biasa karena payload kecil.
- Kalau query mulai berat, cache per user+date selama 5 menit.
