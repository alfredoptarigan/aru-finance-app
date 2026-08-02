# Monthly Review API Contract

Dokumen kontrak untuk fitur review akhir bulan dengan rekomendasi aksi bulan depan.

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

User bisa melihat evaluasi bulan yang sudah berjalan/selesai, tahu penyebab overspending, dan mendapat rekomendasi sederhana untuk bulan depan.

Target awal:

- Ringkas pemasukan, pengeluaran, saldo, dan saving rate bulan tertentu.
- Tampilkan kategori pengeluaran terbesar.
- Tampilkan budget yang warning, habis, atau overbudget.
- Tampilkan progress target tabungan aktif.
- Beri rekomendasi aksi bulan depan yang bisa langsung dilakukan user.
- Simpan catatan refleksi user untuk bulan tersebut.

Non-goal tahap awal:

- AI financial advisor.
- Bank sync.
- Prediksi berbasis model ML.
- Multi-user/family review.
- Export PDF.
- Auto-update budget bulan depan tanpa konfirmasi user.

## Types

```ts
type MonthlyReviewActionKind =
  | 'reduce_spending'
  | 'adjust_budget'
  | 'increase_saving'
  | 'track_transaction'
  | 'review_subscription';

type MonthlyReviewSeverity = 'info' | 'warning' | 'danger' | 'success';

interface MonthlyReview {
  month: number;
  year: number;
  period_start: string; // YYYY-MM-DD
  period_end: string; // YYYY-MM-DD
  summary: MonthlyReviewSummary;
  top_categories: MonthlyReviewCategory[];
  budget_findings: MonthlyReviewBudgetFinding[];
  goal_findings: MonthlyReviewGoalFinding[];
  recommendations: MonthlyReviewRecommendation[];
  user_note: MonthlyReviewNote | null;
  generated_at: string;
}

interface MonthlyReviewSummary {
  income: number;
  expense: number;
  balance: number;
  savings_rate: number;
  transaction_count: number;
  overspending_amount: number;
  monthly_recurring_expense: number;
}

interface MonthlyReviewCategory {
  category_id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  percent_of_expense: number;
}

interface MonthlyReviewBudgetFinding {
  budget_id: string;
  category_id: string;
  category_name: string;
  limit_amount: number;
  spent_amount: number;
  remaining_amount: number;
  usage_percent: number;
  severity: MonthlyReviewSeverity;
}

interface MonthlyReviewGoalFinding {
  goal_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  remaining_amount: number;
  progress_percent: number;
  monthly_savings_estimate: number | null;
  severity: MonthlyReviewSeverity;
}

interface MonthlyReviewRecommendation {
  id: string;
  kind: MonthlyReviewActionKind;
  severity: MonthlyReviewSeverity;
  title: string;
  body: string;
  amount: number | null;
  route: string | null;
}

interface MonthlyReviewNote {
  id: string;
  month: number;
  year: number;
  note: string;
  created_at: string;
  updated_at: string;
}
```

## GET /monthly-review

Return review bulan tertentu.

Query:

```ts
{
  month: number; // 1-12
  year: number;
}
```

Rules:

- `month` dan `year` wajib.
- Data selalu scoped ke user dari access token.
- `period_start` adalah tanggal pertama bulan.
- `period_end` adalah tanggal terakhir bulan.
- Untuk bulan berjalan, hitung sampai hari ini.
- Untuk bulan lampau, hitung satu bulan penuh.
- `recommendations` maksimal 5 item agar UI ringan.

Response:

```json
{
  "success": true,
  "data": {
    "month": 7,
    "year": 2026,
    "period_start": "2026-07-01",
    "period_end": "2026-07-31",
    "summary": {
      "income": 8000000,
      "expense": 6500000,
      "balance": 1500000,
      "savings_rate": 18.75,
      "transaction_count": 84,
      "overspending_amount": 420000,
      "monthly_recurring_expense": 350000
    },
    "top_categories": [
      {
        "category_id": "cat_food",
        "name": "Makanan",
        "icon": "restaurant",
        "color": "#F97316",
        "total": 2100000,
        "percent_of_expense": 32.31
      }
    ],
    "budget_findings": [
      {
        "budget_id": "budget_food",
        "category_id": "cat_food",
        "category_name": "Makanan",
        "limit_amount": 1800000,
        "spent_amount": 2100000,
        "remaining_amount": -300000,
        "usage_percent": 116.67,
        "severity": "danger"
      }
    ],
    "goal_findings": [
      {
        "goal_id": "goal_emergency",
        "title": "Dana Darurat",
        "target_amount": 10000000,
        "current_amount": 2500000,
        "remaining_amount": 7500000,
        "progress_percent": 25,
        "monthly_savings_estimate": 625000,
        "severity": "warning"
      }
    ],
    "recommendations": [
      {
        "id": "reduce_spending:cat_food",
        "kind": "reduce_spending",
        "severity": "danger",
        "title": "Kurangi pengeluaran Makanan",
        "body": "Makanan melewati budget Rp300.000. Bulan depan coba turunkan jajan harian sekitar Rp10.000.",
        "amount": 300000,
        "route": "/(tabs)/budgets"
      },
      {
        "id": "increase_saving:goal_emergency",
        "kind": "increase_saving",
        "severity": "warning",
        "title": "Kejar Dana Darurat",
        "body": "Sisihkan sekitar Rp625.000 bulan depan agar target Dana Darurat tetap realistis.",
        "amount": 625000,
        "route": "/goals"
      }
    ],
    "user_note": {
      "id": "note_123",
      "month": 7,
      "year": 2026,
      "note": "Boros karena banyak makan di luar.",
      "created_at": "2026-07-31T14:00:00.000Z",
      "updated_at": "2026-07-31T14:00:00.000Z"
    },
    "generated_at": "2026-07-31T14:00:00.000Z"
  }
}
```

Empty response rules:

- Jika belum ada transaksi, tetap return `MonthlyReview` dengan angka `0`, array kosong, dan satu recommendation `track_transaction`.
- Jika belum ada budget, `budget_findings` kosong dan recommendation boleh menyarankan buat budget.
- Jika belum ada goal, `goal_findings` kosong dan recommendation boleh menyarankan buat target tabungan.

Error example:

```json
{
  "success": false,
  "error": "month harus 1-12"
}
```

## PUT /monthly-review/note

Create atau update catatan refleksi untuk bulan tertentu.

Request:

```json
{
  "month": 7,
  "year": 2026,
  "note": "Boros karena banyak makan di luar."
}
```

Rules:

- `month`, `year`, dan `note` wajib.
- `note` trim whitespace.
- `note` maksimal 1000 karakter.
- Upsert by `(user_id, month, year)`.

Response:

```json
{
  "success": true,
  "data": {
    "id": "note_123",
    "month": 7,
    "year": 2026,
    "note": "Boros karena banyak makan di luar.",
    "created_at": "2026-07-31T14:00:00.000Z",
    "updated_at": "2026-07-31T14:05:00.000Z"
  }
}
```

## DELETE /monthly-review/note

Delete catatan refleksi bulan tertentu.

Query:

```ts
{
  month: number;
  year: number;
}
```

Response:

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

## Backend Rules

Summary:

- `income`: total transaksi `type = income` dalam periode.
- `expense`: total transaksi `type = expense` dalam periode.
- `balance`: `income - expense`.
- `savings_rate`: `(balance / income) * 100`, atau `0` jika income `0`.
- `transaction_count`: jumlah transaksi dalam periode.
- `monthly_recurring_expense`: reuse logic subscription monthly burn jika tersedia.

Top categories:

- Ambil expense transactions dalam periode.
- Group by category.
- Sort descending by total.
- Return maksimal 5 kategori.
- `percent_of_expense`: `(category_total / expense) * 100`, atau `0` jika expense `0`.

Budget findings:

- Ambil budgets untuk `month` dan `year`.
- Hitung `spent_amount` dari expense transaksi kategori terkait.
- `remaining_amount`: `limit_amount - spent_amount`.
- `usage_percent`: `(spent_amount / limit_amount) * 100`, atau `0` jika limit `0`.
- Severity:
  - `danger` jika `usage_percent >= 100`.
  - `warning` jika `usage_percent >= 80`.
  - `success` jika `usage_percent < 80`.

Goal findings:

- Ambil goal aktif.
- Reuse `progress_percent`, `remaining_amount`, dan `monthly_savings_estimate`.
- Severity:
  - `success` jika `progress_percent >= 100`.
  - `warning` jika `monthly_savings_estimate` ada dan lebih besar dari `balance`.
  - `info` untuk sisanya.

Overspending:

```text
overspending_amount = SUM(max(spent_amount - limit_amount, 0)) over budgets
```

## Recommendation Rules

Generate deterministic recommendations. Tidak perlu AI untuk MVP.

Priority:

1. Overbudget category terbesar.
2. Budget warning terbesar.
3. Saving rate rendah.
4. Goal aktif yang butuh kontribusi bulan depan.
5. Belum banyak transaksi tercatat.
6. Subscription recurring besar.

Rules:

- Maksimal 5 recommendations.
- Sort by severity lalu amount terbesar.
- `id` harus stable agar frontend list tidak flicker.
- `route` pakai route frontend existing jika ada.
- Jangan menyarankan auto-update data. User harus konfirmasi di layar tujuan.

Templates:

```text
reduce_spending:
{category} melewati budget {amount}. Bulan depan coba turunkan jajan harian sekitar {daily_amount}.

adjust_budget:
{category} sudah {usage_percent}% dari budget. Cek apakah budget terlalu kecil atau pengeluaran bisa dikurangi.

increase_saving:
Sisihkan sekitar {amount} bulan depan agar target {goal_title} tetap realistis.

track_transaction:
Transaksi bulan ini masih sedikit. Aktifkan reminder supaya pencatatan lebih rapi.

review_subscription:
Recurring bulanan {amount}. Cek subscription yang jarang dipakai.
```

## Data Model Recommendation

Minimal table baru hanya untuk catatan user:

```sql
monthly_review_notes (
  id uuid primary key,
  user_id uuid not null,
  month int not null,
  year int not null,
  note text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (user_id, month, year)
)
```

Constraints:

- `month between 1 and 12`.
- `length(trim(note)) > 0`.
- `length(note) <= 1000`.

Tidak perlu table untuk hasil review di MVP. Review bisa dihitung on demand dari transaksi, budget, goal, dan subscription.

## Frontend Notes

Entry point paling ringan:

- Tambah card/CTA dari `Insights` ke Monthly Review.
- Default buka bulan berjalan.
- User bisa pilih bulan sebelumnya.
- Render 4 section:
  - Ringkasan.
  - Masalah utama.
  - Rekomendasi bulan depan.
  - Catatan refleksi.

Suggested empty state:

```text
Belum cukup data untuk review
Catat transaksi dan buat budget dulu supaya rekomendasi bulan depan lebih akurat.
```

## Success Criteria

- User tahu penyebab overspending bulan itu.
- User punya 1-5 aksi jelas untuk bulan depan.
- User bisa menyimpan catatan refleksi.
- Backend tidak membuat rekomendasi yang mengubah data tanpa konfirmasi.
- Fitur tetap berguna tanpa AI.
