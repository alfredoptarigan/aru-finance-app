# Budget Planning API Contract

Dokumen kontrak backend untuk mengubah fitur budget saat ini dari manual nominal per kategori menjadi planning bulanan berbasis persentase dari uang tersedia.

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

User bisa input uang tersedia untuk bulan tertentu, lalu membagi uang itu ke beberapa pos dalam bentuk persentase. Backend menghitung nominal budget per pos, tracking pemakaian dari transaksi, dan memberi status sisa/habis/overbudget.

Contoh:

```text
Uang tersedia bulan Juli: Rp10.000.000
Operasional: 50% = Rp5.000.000
Ongkos/BBM: 10% = Rp1.000.000
Jajan: 10% = Rp1.000.000
Nabung/Investasi: 30% = Rp3.000.000
```

Target awal:

- Simpan satu budget plan per user per bulan.
- Simpan allocation per kategori dengan persen dan nominal hasil hitung.
- Total allocation percent wajib 100%.
- Generate atau update `budgets.limit_amount` dari allocation.
- Return status pemakaian: aman, warning, habis, overbudget.
- Return sisa budget per kategori dan total sisa bulan ini.
- Support allocation saving/investment tanpa memaksakan jadi expense biasa.

Non-goal tahap awal:

- Bank sync.
- AI financial advice.
- Shared budget keluarga.
- Multi-currency.
- Rollover otomatis dari bulan sebelumnya.
- Envelope wallet ledger terpisah.

## Existing Frontend Context

Frontend saat ini sudah punya `Budget` per kategori per bulan:

```ts
interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  limit_amount: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  spent_amount: number;
  usage_percent: number;
}
```

Endpoint existing yang dipakai frontend:

```text
GET /budgets?month={month}&year={year}
POST /budgets
PUT /budgets/:id
DELETE /budgets/:id
GET /transactions
GET /categories
GET /goals
POST /goals/:id/contribute
GET /dashboard/summary
GET /dashboard/today-summary
```

Budget planning sebaiknya tidak mengganti endpoint `/budgets`. Tambahkan layer baru di atasnya, lalu tetap generate/update budget existing agar UI lama tetap jalan.

## Types

```ts
type BudgetPlanStatus = 'draft' | 'active' | 'closed';
type BudgetPlanSource = 'manual' | 'balance_snapshot';
type BudgetAllocationKind = 'expense' | 'saving' | 'investment';
type BudgetAllocationStatus = 'safe' | 'warning' | 'exhausted' | 'overbudget';

interface BudgetPlan {
  id: string;
  user_id: string;
  month: number;
  year: number;
  source: BudgetPlanSource;
  available_amount: number;
  balance_snapshot_amount: number | null;
  balance_snapshot_at: string | null;
  allocated_amount: number;
  unallocated_amount: number;
  total_percent: number;
  status: BudgetPlanStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  allocations: BudgetPlanAllocation[];
  summary: BudgetPlanSummary;
}

interface BudgetPlanAllocation {
  id: string;
  plan_id: string;
  category_id: string | null;
  goal_id: string | null;
  kind: BudgetAllocationKind;
  name: string;
  icon: string;
  color: string;
  percent: number;
  planned_amount: number;
  actual_amount: number;
  remaining_amount: number;
  usage_percent: number;
  status: BudgetAllocationStatus;
  budget_id: string | null;
  created_at: string;
  updated_at: string;
}

interface BudgetPlanSummary {
  spent_amount: number;
  saved_amount: number;
  remaining_amount: number;
  overbudget_amount: number;
  warning_count: number;
  exhausted_count: number;
  overbudget_count: number;
  daily_safe_to_spend: number;
  days_left_in_month: number;
}
```

Field meaning:

- `source`: sumber nominal planner. `manual` berarti user isi sendiri. `balance_snapshot` berarti backend ambil sisa saldo saat plan dibuat.
- `available_amount`: base 100% untuk allocation. Jika `manual`, berasal dari input user. Jika `balance_snapshot`, berasal dari snapshot saldo backend.
- `balance_snapshot_amount`: sisa saldo yang diambil backend saat source `balance_snapshot`; `null` untuk manual.
- `balance_snapshot_at`: waktu snapshot saldo dibuat; `null` untuk manual.
- `allocated_amount`: total `planned_amount` dari semua allocation.
- `unallocated_amount`: `available_amount - allocated_amount`.
- `total_percent`: total `percent` dari semua allocation.
- `kind = expense`: pemakaian dihitung dari expense transactions di kategori terkait.
- `kind = saving` atau `investment`: progress bisa dihitung dari goal contribution atau income/transfer khusus jika backend sudah punya modelnya.
- `budget_id`: id budget existing yang digenerate untuk allocation expense.
- `daily_safe_to_spend`: sisa allocation expense dibagi sisa hari bulan ini.

## Data Model Recommendation

Minimal table baru:

```sql
budget_plans (
  id uuid primary key,
  user_id uuid not null,
  month int not null,
  year int not null,
  source text not null default 'manual',
  available_amount numeric(14,2) not null,
  balance_snapshot_amount numeric(14,2) null,
  balance_snapshot_at timestamptz null,
  status text not null default 'active',
  notes text null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (user_id, month, year)
)
```

```sql
budget_plan_allocations (
  id uuid primary key,
  plan_id uuid not null,
  category_id uuid null,
  goal_id uuid null,
  kind text not null,
  name text not null,
  icon text not null,
  color text not null,
  percent numeric(5,2) not null,
  planned_amount numeric(14,2) not null,
  budget_id uuid null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

Recommended constraints:

- `budget_plans` unique by `(user_id, month, year)`.
- `month` between 1 and 12.
- `source in ('manual', 'balance_snapshot')`.
- `available_amount > 0`.
- if `source = 'manual'`, request must include `available_amount`.
- if `source = 'balance_snapshot'`, backend calculates `available_amount` from available balance and stores `balance_snapshot_amount` + `balance_snapshot_at`.
- allocation `percent > 0`.
- allocation `kind in ('expense', 'saving', 'investment')`.
- if `kind = 'expense'`, `category_id` required.
- if `kind in ('saving', 'investment')`, `goal_id` optional for MVP but recommended.
- total allocation percent must equal 100 when activating plan.
- all referenced category/goal records must belong to authenticated user.

## Calculation Rules

`planned_amount`:

```text
round(available_amount * percent / 100)
```

Rounding:

- Backend should make final allocation absorb rounding difference so total planned equals `available_amount`.
- Example: if rounded allocation total differs by Rp1, add/subtract difference to last allocation.

Expense actual:

```text
SUM(transactions.amount)
WHERE type = 'expense'
AND category_id = allocation.category_id
AND transaction_date is inside plan month/year
```

Saving/investment actual, MVP:

```text
goal.current_amount delta during month
```

If backend cannot calculate monthly goal contribution yet, return `actual_amount = 0` and add `requires_manual_tracking: true` later if needed. Better follow-up: create `goal_contributions` table so monthly saving progress is auditable.

Status:

```text
usage_percent = actual_amount / planned_amount * 100
remaining_amount = planned_amount - actual_amount
```

```ts
if (usage_percent > 100) status = 'overbudget';
else if (usage_percent >= 100) status = 'exhausted';
else if (usage_percent >= 80) status = 'warning';
else status = 'safe';
```

Daily safe to spend:

```text
sum remaining_amount for expense allocations with status != overbudget / days_left_in_month
```

Use user's local date/timezone if profile has timezone. If not, use server default consistently and return `date` in response where relevant.


## Balance Snapshot Rules

Planner can use two source modes:

```ts
type BudgetPlanSource = 'manual' | 'balance_snapshot';
```

`manual`:

- Frontend sends `available_amount`.
- Backend stores it as-is after validation.
- User can still create planner from custom nominal, for example cash outside app or adjusted salary.

`balance_snapshot`:

- Frontend sends `source = 'balance_snapshot'` and does not need to send `available_amount`.
- Backend calculates available balance at creation/update time.
- Backend stores calculated value into both `available_amount` and `balance_snapshot_amount`.
- Backend stores current timestamp into `balance_snapshot_at`.
- Future income transactions must not auto-change `available_amount`.
- Future expense transactions reduce allocation `actual_amount` through normal expense tracking.

Recommended available balance formula for MVP:

```text
available_balance = income_month_to_date - expense_month_to_date
```

If backend already has fixed bills/subscriptions/cicilan marked as committed spending, use:

```text
available_balance = income_month_to_date - expense_month_to_date - unpaid_committed_amount
```

Do not subtract generated budget allocations from available balance. Allocations are plan, not real spending.

Income handling:

- New income transaction updates global cashflow/balance.
- New income transaction does not update existing budget plan snapshot.
- User must explicitly refresh snapshot if they want planner base to change.

Expense handling:

- New expense transaction updates matching expense allocation `actual_amount` by category/month.
- This is automatic because allocation actual is calculated from transactions.
- Expense does not mutate `available_amount`; it changes `actual_amount`, `remaining_amount`, and status.

## GET /budget-plans/:year/:month

Return budget plan for month.

Response if exists:

```json
{
  "success": true,
  "data": {
    "id": "plan_123",
    "user_id": "user_123",
    "month": 7,
    "year": 2026,
    "source": "balance_snapshot",
    "available_amount": 10000000,
    "balance_snapshot_amount": 10000000,
    "balance_snapshot_at": "2026-07-05T10:00:00.000Z",
    "allocated_amount": 10000000,
    "unallocated_amount": 0,
    "total_percent": 100,
    "status": "active",
    "notes": "Gaji Juli setelah cicilan",
    "created_at": "2026-07-05T10:00:00.000Z",
    "updated_at": "2026-07-05T10:00:00.000Z",
    "allocations": [
      {
        "id": "alloc_1",
        "plan_id": "plan_123",
        "category_id": "cat_operasional",
        "goal_id": null,
        "kind": "expense",
        "name": "Operasional",
        "icon": "cart",
        "color": "#3B82F6",
        "percent": 50,
        "planned_amount": 5000000,
        "actual_amount": 2200000,
        "remaining_amount": 2800000,
        "usage_percent": 44,
        "status": "safe",
        "budget_id": "budget_1",
        "created_at": "2026-07-05T10:00:00.000Z",
        "updated_at": "2026-07-05T10:00:00.000Z"
      },
      {
        "id": "alloc_2",
        "plan_id": "plan_123",
        "category_id": "cat_jajan",
        "goal_id": null,
        "kind": "expense",
        "name": "Jajan",
        "icon": "fast-food",
        "color": "#F97316",
        "percent": 10,
        "planned_amount": 1000000,
        "actual_amount": 1000000,
        "remaining_amount": 0,
        "usage_percent": 100,
        "status": "exhausted",
        "budget_id": "budget_2",
        "created_at": "2026-07-05T10:00:00.000Z",
        "updated_at": "2026-07-05T10:00:00.000Z"
      },
      {
        "id": "alloc_3",
        "plan_id": "plan_123",
        "category_id": null,
        "goal_id": "goal_dana_darurat",
        "kind": "saving",
        "name": "Nabung Dana Darurat",
        "icon": "wallet",
        "color": "#22C55E",
        "percent": 40,
        "planned_amount": 4000000,
        "actual_amount": 1500000,
        "remaining_amount": 2500000,
        "usage_percent": 37.5,
        "status": "safe",
        "budget_id": null,
        "created_at": "2026-07-05T10:00:00.000Z",
        "updated_at": "2026-07-05T10:00:00.000Z"
      }
    ],
    "summary": {
      "spent_amount": 3200000,
      "saved_amount": 1500000,
      "remaining_amount": 5300000,
      "overbudget_amount": 0,
      "warning_count": 0,
      "exhausted_count": 1,
      "overbudget_count": 0,
      "daily_safe_to_spend": 140000,
      "days_left_in_month": 20
    }
  }
}
```

Response if not exists:

```json
{
  "success": false,
  "error": "Budget plan tidak ditemukan"
}
```

Recommended status: `404`.

## POST /budget-plans

Create or upsert budget plan for month.

Request:

```json
{
  "month": 7,
  "year": 2026,
  "source": "manual",
  "available_amount": 10000000,
  "notes": "Gaji Juli setelah cicilan",
  "allocations": [
    {
      "kind": "expense",
      "category_id": "cat_operasional",
      "name": "Operasional",
      "icon": "cart",
      "color": "#3B82F6",
      "percent": 50
    },
    {
      "kind": "expense",
      "category_id": "cat_jajan",
      "name": "Jajan",
      "icon": "fast-food",
      "color": "#F97316",
      "percent": 10
    },
    {
      "kind": "saving",
      "goal_id": "goal_dana_darurat",
      "name": "Nabung Dana Darurat",
      "icon": "wallet",
      "color": "#22C55E",
      "percent": 40
    }
  ]
}
```

Required:

- `month`
- `year`
- `source` (`manual` default if omitted)
- `available_amount` when `source = manual`
- `allocations`
- each allocation: `kind`, `percent`, `name`
- `category_id` for `kind = expense`

Rules:

- If plan for `(user_id, month, year)` already exists, either reject with `409` or upsert. Prefer upsert only if frontend can safely replace all allocations.
- Total `percent` must equal `100`.
- Backend calculates `available_amount` if `source = balance_snapshot`.
- Backend calculates `planned_amount`; frontend must not send it.
- Backend creates or updates existing `/budgets` rows for `expense` allocations.
- Existing budget uniqueness stays: one budget per category/month/year.
- Saving/investment allocations should not create expense budget rows.

Response: same shape as `GET /budget-plans/:year/:month`.

Validation errors:

```json
{
  "success": false,
  "error": "Total persentase allocation harus 100%"
}
```

```json
{
  "success": false,
  "error": "category_id wajib untuk allocation expense"
}
```

## GET /budget-plans/available-balance

Return sisa saldo yang bisa dipakai sebagai base planner.

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
    "month": 7,
    "year": 2026,
    "available_balance": 10000000,
    "income_month_to_date": 12000000,
    "expense_month_to_date": 2000000,
    "unpaid_committed_amount": 0,
    "calculated_at": "2026-07-05T10:00:00.000Z"
  }
}
```

Rules:

- Scope by authenticated user.
- `month` and `year` required.
- This endpoint does not create or mutate plan.
- Frontend uses this for preview button: `Pakai sisa saldo sekarang`.

## PUT /budget-plans/:id

Update plan header and replace allocations.

Request shape same as `POST /budget-plans`, except `month` and `year` can be immutable.

Rules:

- Recalculate all `planned_amount`.
- Update generated `budgets.limit_amount` for expense allocations.
- If an old expense allocation is removed, backend can either delete generated budget or detach it. For MVP, delete generated budget only if `budget_id` was created by budget plan.
- Never delete user-created manual budgets unless explicitly linked by `budget_id`.

Response: same shape as `GET /budget-plans/:year/:month`.

## POST /budget-plans/:id/refresh-balance

Refresh planner base from latest available balance.

Use only when user explicitly taps `Update dari saldo terbaru`.

Request:

```json
{}
```

Rules:

- Only valid for `source = balance_snapshot` plans.
- Backend recalculates available balance for plan month/year.
- Backend updates `available_amount`, `balance_snapshot_amount`, and `balance_snapshot_at`.
- Backend recalculates all allocation `planned_amount` from existing percentages.
- Backend updates generated budget limits for expense allocations.
- Backend must not run this automatically when income is created.

Response: same shape as `GET /budget-plans/:year/:month`.

## DELETE /budget-plans/:id

Delete plan.

Rules:

- Delete allocations.
- Delete generated budgets only if backend can prove they came from this plan.
- If uncertain, keep budgets and set allocation `budget_id` null before delete.

Response:

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

## POST /budget-plans/:id/apply-to-budgets

Optional endpoint if backend does not want auto-sync on create/update.

Behavior:

- Generate/update `/budgets` rows for all `expense` allocations.
- Return updated plan.

MVP recommendation: auto-sync inside create/update, so this endpoint is not needed.

## GET /budget-plans/templates

Return reusable allocation templates.

MVP can hardcode recommended templates server-side:

```json
{
  "success": true,
  "data": [
    {
      "id": "balanced_50_30_20",
      "name": "Balanced",
      "description": "50% kebutuhan, 30% lifestyle, 20% tabungan",
      "allocations": [
        { "name": "Kebutuhan", "kind": "expense", "percent": 50 },
        { "name": "Lifestyle", "kind": "expense", "percent": 30 },
        { "name": "Tabungan", "kind": "saving", "percent": 20 }
      ]
    },
    {
      "id": "aggressive_saving",
      "name": "Fokus Nabung",
      "description": "Cocok untuk ngejar dana darurat atau investasi",
      "allocations": [
        { "name": "Operasional", "kind": "expense", "percent": 50 },
        { "name": "Jajan", "kind": "expense", "percent": 10 },
        { "name": "Nabung/Investasi", "kind": "saving", "percent": 40 }
      ]
    }
  ]
}
```

Frontend can map template item to actual category/goal before submit.

## Dashboard / Summary Additions

Add budget plan snapshot to `/dashboard/today-summary` later.

Suggested type:

```ts
interface BudgetPlanSnapshot {
  plan_id: string;
  month: number;
  year: number;
  available_amount: number;
  spent_amount: number;
  saved_amount: number;
  remaining_amount: number;
  daily_safe_to_spend: number;
  exhausted_count: number;
  overbudget_count: number;
}
```

Suggested `SummaryItem` examples:

```json
{
  "id": "budget-plan:plan_123:jajan-exhausted",
  "kind": "budget",
  "severity": "danger",
  "title": "Budget jajan habis",
  "subtitle": "Jangan tambah pengeluaran di kategori Jajan bulan ini",
  "amount": 0,
  "route": "/budgets"
}
```

```json
{
  "id": "budget-plan:plan_123:daily-safe",
  "kind": "cashflow",
  "severity": "info",
  "title": "Aman belanja Rp140.000 per hari",
  "subtitle": "Berdasarkan sisa budget expense bulan ini",
  "amount": 140000,
  "route": "/budgets"
}
```

## Backend Improvements Recommended

### 1. Track Goal Contributions

Saat ini frontend punya `POST /goals/:id/contribute`, tapi untuk budget planning backend perlu histori kontribusi agar bisa hitung nabung bulan ini.

Recommended table:

```sql
goal_contributions (
  id uuid primary key,
  user_id uuid not null,
  goal_id uuid not null,
  amount numeric(14,2) not null,
  contribution_date date not null,
  note text null,
  created_at timestamptz not null
)
```

Then `POST /goals/:id/contribute` should insert row and update `goals.current_amount`.

### 2. Mark Generated Budgets

Add nullable field to budgets:

```text
source: 'manual' | 'budget_plan'
budget_plan_allocation_id: uuid null
```

This prevents accidental delete/update of user-created manual budget.

### 3. Add Category Purpose

Categories can stay generic, but planning is easier if backend can identify category purpose:

```text
purpose: 'needs' | 'wants' | 'transport' | 'saving' | 'investment' | 'other'
```

This is optional. Do not block MVP on it.

### 4. Add Monthly Close

Later, allow plan status `closed` after month ends. Closing stores final snapshot so old months do not change if transactions are edited later.

MVP can skip this and always calculate live.

### 5. Notification Hooks

Later, backend can expose alert candidates:

- budget allocation reaches 80%.
- allocation reaches 100%.
- overbudget detected.
- saving target for month not reached near month end.

Do not send push from backend until notification preferences exist.

## MVP Build Order

1. Add `source`, `balance_snapshot_amount`, and `balance_snapshot_at` to `budget_plans`.
2. Create `budget_plans` and `budget_plan_allocations` if they do not exist yet.
3. Implement `GET /budget-plans/available-balance`.
4. Implement `GET /budget-plans/:year/:month`.
5. Implement `POST /budget-plans` with `manual` and `balance_snapshot` source support.
6. Auto-generate/update existing `budgets` for expense allocations.
7. Implement `PUT /budget-plans/:id`.
8. Implement `POST /budget-plans/:id/refresh-balance` if refresh UX is needed.
9. Add goal contribution history if saving/investment progress must be exact.
10. Add dashboard snapshot after plan endpoint stable.

## Acceptance Criteria

- User can create one budget plan for a month from manual nominal.
- User can create one budget plan for a month from available balance snapshot.
- Total allocation percent cannot be below or above 100%.
- Backend calculates all nominal amounts from `available_amount`.
- Income transactions do not auto-change existing plan `available_amount`.
- Expense transactions update allocation actual/remaining/status through category matching.
- Expense allocations appear in existing `/budgets` result.
- Existing budget screen still works without budget plan.
- Plan detail returns actual spent, remaining, usage percent, and status per allocation.
- Saving allocation can show required saving amount for month.
- All reads/writes are scoped to authenticated user.
- Validation errors use existing `{ success: false, error }` wrapper.

## Open Questions for Backend

- Should `POST /budget-plans` upsert or return `409` if plan exists?
- Does backend already have timezone per user?
- Does `POST /goals/:id/contribute` store contribution history now, or only update current amount?
- Should saving/investment be linked to `goals`, categories, or both?
- Should deleting a plan delete generated budgets, or leave them as manual budgets?
- Exact available balance formula: current MTD cashflow only, or subtract unpaid committed bills too?
