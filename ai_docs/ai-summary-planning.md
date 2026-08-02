# AI Summary / Planning API Contract

Dokumen kontrak untuk fitur AI Summary dan Planning. Scope awal: AI membaca data finance mingguan/bulanan, mengembalikan insight pendek, lalu hasilnya disimpan agar tidak boros token.

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

User bisa tahu uang bocor di mana, sisa aman dipakai, dan tindakan berikutnya tanpa membaca semua transaksi manual.

Target awal:

- AI Summary periode `weekly` dan `monthly`.
- 3 insight utama: bocor terbesar, sisa aman, saran tindakan.
- Hasil AI disimpan per user + periode.
- Refresh AI hanya manual.
- Payload ke AI kecil: agregat dulu, transaksi detail hanya top/terbaru yang relevan.

Non-goal tahap awal:

- Chat bebas dengan AI.
- Auto-transfer uang.
- Prediksi investasi.
- Rekomendasi kredit/hutang.
- Refresh otomatis.
- Mengirim semua histori transaksi ke AI.

## Product Placement

Placement awal:

1. `Insights` menjadi pusat AI Summary.
2. `Home` hanya menampilkan teaser 1 card dan link ke `Insights`.
3. `Budget Planner` menampilkan saran tindakan dari AI yang terkait budget bulan depan.
4. `Profile` cukup entry menu `AI Insights` atau tetap `Insights`.

UI minimal di `Insights`:

```text
[AI Summary]
- Bocor terbesar
- Sisa aman
- Saran tindakan
[Refresh AI]
```

UI minimal di `Budget Planner`:

```text
[AI Planning]
- Kurangi kategori X RpY
- Aman per hari RpZ
- Tambah goal/saving RpN jika memungkinkan
```

## Types

```ts
type AiSummaryPeriod = 'weekly' | 'monthly';
type AiInsightKind = 'leak' | 'safe_to_spend' | 'action';
type AiInsightSeverity = 'info' | 'warning' | 'danger' | 'success';
type AiSummaryStatus = 'fresh' | 'stale' | 'generating';

interface AiSummary {
  id: string;
  user_id: string;
  period: AiSummaryPeriod;
  period_start: string; // YYYY-MM-DD
  period_end: string; // YYYY-MM-DD
  month: number | null;
  year: number;
  status: AiSummaryStatus;
  model: string;
  prompt_version: string;
  input_hash: string;
  summary: string;
  insights: AiInsight[];
  token_usage: AiTokenUsage | null;
  generated_at: string;
  refreshed_at: string | null;
}

interface AiInsight {
  id: string;
  kind: AiInsightKind;
  severity: AiInsightSeverity;
  title: string;
  body: string;
  amount: number | null;
  category_id: string | null;
  route: string | null;
}

interface AiTokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_idr: number | null;
}
```

## Data Sent To AI

Backend yang menyusun payload. App tidak memanggil AI langsung.

Kirim data minimum:

```ts
interface AiFinancePayload {
  locale: 'id-ID';
  currency: 'IDR';
  period: AiSummaryPeriod;
  period_start: string;
  period_end: string;
  cashflow: {
    income: number;
    expense: number;
    balance: number;
    savings_rate: number;
    transaction_count: number;
    daily_safe_to_spend: number;
  };
  top_categories: Array<{
    category_id: string;
    name: string;
    total: number;
    percent_of_expense: number;
    transaction_count: number;
    previous_period_total: number | null;
  }>;
  budget_findings: Array<{
    category_id: string;
    category_name: string;
    limit_amount: number;
    spent_amount: number;
    remaining_amount: number;
    usage_percent: number;
    status: 'safe' | 'warning' | 'exhausted' | 'overbudget';
  }>;
  goals: Array<{
    goal_id: string;
    title: string;
    target_amount: number;
    current_amount: number;
    remaining_amount: number;
    progress_percent: number;
    deadline: string | null;
  }>;
  recurring: Array<{
    name: string;
    amount: number;
    due_date: string | null;
    category_name: string | null;
  }>;
  sample_transactions: Array<{
    date: string;
    type: 'income' | 'expense';
    category_name: string;
    amount: number;
    description: string | null;
  }>;
}
```

Rules payload:

- `top_categories` maksimal 5.
- `budget_findings` maksimal 5, urut dari paling bermasalah.
- `goals` maksimal 5 goal aktif paling relevan.
- `recurring` maksimal 10.
- `sample_transactions` maksimal 20, hanya transaksi terbesar/terbaru yang menjelaskan insight.
- Jangan kirim access token, refresh token, email, password, atau profile personal.
- `description` boleh dikirim karena user mengizinkan, tapi tetap boleh `null` jika kosong atau terlalu sensitif.
- Untuk hemat token, angka dikirim sebagai number, bukan string format Rupiah.

## AI Output Contract

AI wajib return JSON valid, bukan markdown bebas.

```ts
interface AiModelOutput {
  summary: string;
  insights: Array<{
    kind: AiInsightKind;
    severity: AiInsightSeverity;
    title: string;
    body: string;
    amount: number | null;
    category_id: string | null;
    route: string | null;
  }>;
}
```

Rules output:

- `summary` maksimal 400 karakter.
- `insights` wajib 3 item: `leak`, `safe_to_spend`, `action`.
- Bahasa Indonesia, tone praktis, bukan financial advisor formal.
- Jangan menyuruh pinjam uang, ambil kredit, investasi spesifik, atau auto-transfer.
- Jika data kurang, output harus bilang data belum cukup dan beri tindakan ringan.

## Database Recommendation

Ya, pendapat AI sebaiknya disimpan di database agar hemat token dan bisa ditampilkan ulang cepat.

Minimal table:

```sql
ai_summaries (
  id uuid primary key,
  user_id uuid not null,
  period text not null,
  period_start date not null,
  period_end date not null,
  month int null,
  year int not null,
  model text not null,
  prompt_version text not null,
  input_hash text not null,
  summary text not null,
  insights jsonb not null,
  token_usage jsonb null,
  generated_at timestamptz not null,
  refreshed_at timestamptz null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (user_id, period, period_start, period_end)
)
```

Recommended indexes:

```sql
create index ai_summaries_user_period_idx
  on ai_summaries (user_id, period, period_start desc);
```

Rules:

- Unique per `(user_id, period, period_start, period_end)`.
- `input_hash` dibuat dari payload agregat yang dikirim ke AI.
- Jika summary ada dan `input_hash` sama, return cache tanpa panggil AI.
- Jika `input_hash` beda, return data lama dengan `status: 'stale'` sampai user tekan refresh.
- Refresh manual membuat panggilan AI baru dan replace row lama.
- Simpan `model` dan `prompt_version` untuk audit hasil.

## GET /ai/summary

Return saved AI Summary. Tidak memanggil AI.

Query:

```ts
{
  period: 'weekly' | 'monthly';
  date?: string; // YYYY-MM-DD, default today
}
```

Rules:

- `weekly` memakai Senin-Minggu.
- `monthly` memakai tanggal pertama sampai terakhir bulan.
- Jika belum ada summary, return `null` agar UI bisa tampilkan CTA generate.
- Jika data transaksi berubah sejak summary dibuat, return summary lama dengan `status: 'stale'`.

Response:

```json
{
  "success": true,
  "data": {
    "summary": null,
    "can_generate": true,
    "stale_reason": null
  }
}
```

Atau jika sudah ada:

```json
{
  "success": true,
  "data": {
    "summary": {
      "id": "ai_sum_123",
      "user_id": "user_123",
      "period": "monthly",
      "period_start": "2026-07-01",
      "period_end": "2026-07-31",
      "month": 7,
      "year": 2026,
      "status": "fresh",
      "model": "gpt-4.1-mini",
      "prompt_version": "ai-summary-v1",
      "input_hash": "sha256:abc123",
      "summary": "Bulan ini uang paling banyak bocor di Makanan. Sisa aman masih ada, tapi perlu rem jajan harian agar target tabungan tidak turun.",
      "insights": [
        {
          "id": "leak:cat_food",
          "kind": "leak",
          "severity": "warning",
          "title": "Bocor terbesar: Makanan",
          "body": "Makanan mengambil 32% dari total pengeluaran bulan ini.",
          "amount": 2100000,
          "category_id": "cat_food",
          "route": "/(tabs)/transactions"
        },
        {
          "id": "safe_to_spend:monthly",
          "kind": "safe_to_spend",
          "severity": "info",
          "title": "Sisa aman per hari",
          "body": "Dengan sisa bulan ini, batas aman sekitar Rp85.000 per hari.",
          "amount": 85000,
          "category_id": null,
          "route": "/(tabs)/budgets"
        },
        {
          "id": "action:reduce_food",
          "kind": "action",
          "severity": "success",
          "title": "Aksi minggu ini",
          "body": "Turunkan jajan harian Rp10.000 agar kategori Makanan turun bulan depan.",
          "amount": 10000,
          "category_id": "cat_food",
          "route": "/(tabs)/budgets"
        }
      ],
      "token_usage": {
        "input_tokens": 1200,
        "output_tokens": 250,
        "total_tokens": 1450,
        "estimated_cost_idr": null
      },
      "generated_at": "2026-07-08T12:00:00Z",
      "refreshed_at": null
    },
    "can_generate": true,
    "stale_reason": null
  }
}
```

## POST /ai/summary/generate

Generate atau refresh AI Summary. Endpoint ini yang memanggil AI.

Body:

```ts
{
  period: 'weekly' | 'monthly';
  date?: string; // YYYY-MM-DD, default today
  force?: boolean; // default false
}
```

Rules:

- Jika summary fresh dan `force !== true`, return cache tanpa panggil AI.
- Jika `force === true`, panggil AI dan replace summary lama.
- Backend wajib rate limit per user, contoh 5 refresh/hari.
- Backend wajib validasi output AI sebelum simpan.
- Jika AI gagal, jangan hapus summary lama.

Response sama seperti `GET /ai/summary`, tapi `summary` wajib ada jika sukses generate.

## Backend Flow

```text
Client buka Insights
  -> GET /ai/summary?period=monthly
    -> backend build current payload hash
    -> jika row ada + hash sama: return fresh cached summary
    -> jika row ada + hash beda: return stale cached summary
    -> jika row tidak ada: return null + can_generate true

User tekan Refresh AI
  -> POST /ai/summary/generate { period, date, force: true }
    -> backend ambil data transaksi/budget/goals
    -> backend buat payload kecil
    -> backend panggil AI dengan JSON output contract
    -> backend validasi hasil
    -> backend upsert ai_summaries
    -> backend return saved summary
```

## Token Saving Rules

- Jangan panggil AI saat screen load jika cached summary ada.
- Jangan refresh otomatis setelah transaksi berubah; tampilkan badge `Perlu refresh`.
- Kirim agregat, bukan semua transaksi.
- Batasi sample transaksi maksimal 20.
- Simpan hasil AI per periode.
- Pakai `input_hash` agar backend tahu data berubah tanpa panggil AI.
- Simpan `token_usage` untuk tracking biaya.
- Prompt dibuat versi tetap, contoh `ai-summary-v1`, agar output stabil.

## Prompt Shape

System prompt ringkas:

```text
Kamu adalah asisten budgeting pribadi. Jawab dalam Bahasa Indonesia. Beri insight praktis berdasarkan data. Jangan memberi saran kredit, hutang, investasi spesifik, atau klaim pasti. Return JSON sesuai schema.
```

User payload:

```json
{
  "task": "Generate weekly/monthly personal finance summary",
  "schema": "AiModelOutput",
  "data": "<AiFinancePayload>"
}
```

## Frontend States

```text
No summary:
  Tampilkan empty card + tombol Generate AI Summary.

Fresh summary:
  Tampilkan summary + 3 insight + generated_at.

Stale summary:
  Tampilkan summary lama + badge Data berubah + tombol Refresh AI.

Generating:
  Disable tombol refresh + loading state.

AI error:
  Tampilkan error ringan. Jika summary lama ada, tetap tampilkan summary lama.
```

## Open Questions

- Model final ChatGPT apa yang dipakai.
- Berapa rate limit refresh manual per hari.
- Apakah `description` transaksi perlu masking saat production.
- Apakah weekly summary memakai minggu berjalan atau 7 hari terakhir.
