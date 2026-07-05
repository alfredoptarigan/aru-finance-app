# Budget Planner Buckets API Contract

Simplified budget planner contract. User no longer maps every planner row to categories manually. Backend owns bucket mapping and tracks expense automatically from transactions.

Base path:

```text
{EXPO_PUBLIC_API_URL}/api
```

Auth/header same as other docs:

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

User creates monthly plan from either:

- `balance_snapshot`: backend uses current available balance once.
- `manual`: user inputs available amount manually.

User only configures split percentages. Backend maps transactions into fixed buckets.

## Fixed Buckets

```ts
type BudgetPlanBucketKey = 'operational' | 'fun' | 'investing';
```

Recommended default split:

```text
Operational: 50%
Fun/Jajan: 10%
Investing/Nabung: 40%
```

Bucket mapping:

| bucket_key | Label | Categories |
| --- | --- | --- |
| `operational` | Operasional | `Belanja`, `Kesehatan`, `Lainnya`, `Transportasi` |
| `fun` | Jajan | `Makanan`, `Hiburan` |
| `investing` | Nabung/Investasi | `Investasi` |

Rules:

- Match categories by stable category id if possible.
- Category names above are fallback/display contract.
- Only `expense` transactions reduce buckets.
- `income` transactions never reduce buckets and never auto-change existing `available_amount`.
- If plan uses `balance_snapshot`, backend snapshots available balance once. New income does not change planner unless user refreshes snapshot.
- Manual plans can be edited by user; backend should not recalculate amount unless user requests it.

## Types

```ts
type BudgetPlanSource = 'manual' | 'balance_snapshot';
type BudgetPlanStatus = 'draft' | 'active' | 'closed';
type BudgetPlanBucketStatus = 'safe' | 'warning' | 'exhausted' | 'overbudget';

type BudgetPlanBucketKey = 'operational' | 'fun' | 'investing';

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
  buckets: BudgetPlanBucket[];
  // Backward-compatible alias if frontend still reads allocations.
  allocations?: BudgetPlanBucket[];
  summary: BudgetPlanSummary;
}

interface BudgetPlanBucket {
  id: string;
  plan_id: string;
  bucket_key: BudgetPlanBucketKey;
  name: string;
  icon: string;
  color: string;
  percent: number;
  planned_amount: number;
  actual_amount: number;
  remaining_amount: number;
  usage_percent: number;
  status: BudgetPlanBucketStatus;
  category_ids: string[];
  category_names: string[];
  created_at: string;
  updated_at: string;
}

interface BudgetPlanSummary {
  spent_amount: number;
  invested_amount: number;
  remaining_amount: number;
  overbudget_amount: number;
  warning_count: number;
  exhausted_count: number;
  overbudget_count: number;
  daily_safe_to_spend: number;
  days_left_in_month: number;
}
```

## GET /budget-plans/available-balance

Preview available balance for planner source `balance_snapshot`.

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
    "available_balance": 3330978,
    "income_month_to_date": 5000000,
    "expense_month_to_date": 1669022,
    "unpaid_committed_amount": 0,
    "calculated_at": "2026-07-05T14:00:00.000Z"
  }
}
```

MVP formula:

```text
available_balance = income_month_to_date - expense_month_to_date - unpaid_committed_amount
```

## GET /budget-plans/:year/:month

Return monthly budget plan.

Response example:

```json
{
  "success": true,
  "data": {
    "id": "plan_123",
    "user_id": "user_123",
    "month": 7,
    "year": 2026,
    "source": "balance_snapshot",
    "available_amount": 3330978,
    "balance_snapshot_amount": 3330978,
    "balance_snapshot_at": "2026-07-05T14:00:00.000Z",
    "allocated_amount": 3330978,
    "unallocated_amount": 0,
    "total_percent": 100,
    "status": "active",
    "notes": null,
    "created_at": "2026-07-05T14:00:00.000Z",
    "updated_at": "2026-07-05T14:00:00.000Z",
    "buckets": [
      {
        "id": "bucket_operational",
        "plan_id": "plan_123",
        "bucket_key": "operational",
        "name": "Operasional",
        "icon": "cart-outline",
        "color": "#6366F1",
        "percent": 50,
        "planned_amount": 1665489,
        "actual_amount": 250000,
        "remaining_amount": 1415489,
        "usage_percent": 15,
        "status": "safe",
        "category_ids": ["cat_belanja", "cat_kesehatan", "cat_lainnya", "cat_transportasi"],
        "category_names": ["Belanja", "Kesehatan", "Lainnya", "Transportasi"],
        "created_at": "2026-07-05T14:00:00.000Z",
        "updated_at": "2026-07-05T14:00:00.000Z"
      }
    ],
    "allocations": [],
    "summary": {
      "spent_amount": 250000,
      "invested_amount": 0,
      "remaining_amount": 3080978,
      "overbudget_amount": 0,
      "warning_count": 0,
      "exhausted_count": 0,
      "overbudget_count": 0,
      "daily_safe_to_spend": 102699,
      "days_left_in_month": 30
    }
  }
}
```

## POST /budget-plans

Create plan from fixed bucket split.

Manual request:

```json
{
  "month": 7,
  "year": 2026,
  "source": "manual",
  "available_amount": 3330978,
  "notes": "Plan Juli",
  "buckets": [
    { "bucket_key": "operational", "percent": 50 },
    { "bucket_key": "fun", "percent": 10 },
    { "bucket_key": "investing", "percent": 40 }
  ]
}
```

Balance snapshot request:

```json
{
  "month": 7,
  "year": 2026,
  "source": "balance_snapshot",
  "notes": "Pakai sisa saldo sekarang",
  "buckets": [
    { "bucket_key": "operational", "percent": 50 },
    { "bucket_key": "fun", "percent": 10 },
    { "bucket_key": "investing", "percent": 40 }
  ]
}
```

Rules:

- `buckets` must contain the 3 fixed bucket keys exactly once.
- Total percent must equal 100.
- Backend fills `name`, `icon`, `color`, `category_ids`, and `category_names`.
- If `source = manual`, `available_amount` required.
- If `source = balance_snapshot`, backend calculates `available_amount` and stores snapshot fields.
- Backend calculates `planned_amount` from `available_amount * percent / 100`.
- Backend absorbs rounding difference in last bucket so total planned equals available amount.

Response: same shape as `GET /budget-plans/:year/:month`.

## PUT /budget-plans/:id

Update source, amount, notes, and bucket percentages.

Rules:

- Same request shape as `POST /budget-plans`.
- Existing category mapping remains backend-owned.
- Updating manual plan can change `available_amount`.
- Updating snapshot plan does not recalculate balance unless source switches to `balance_snapshot` or `/refresh-balance` is called.

Response: same shape as `GET /budget-plans/:year/:month`.

## POST /budget-plans/:id/refresh-balance

Refresh only snapshot amount.

Rules:

- Only valid for `source = balance_snapshot`.
- Recalculate `available_amount`, `balance_snapshot_amount`, `balance_snapshot_at`.
- Recalculate planned amount for all buckets using existing percents.
- Do not change bucket percentages.

Response: same shape as `GET /budget-plans/:year/:month`.

## Tracking Rules

Expense transaction bucket matching:

```text
bucket.actual_amount = SUM(transactions.amount)
WHERE transactions.type = 'expense'
AND transactions.category_id IN bucket.category_ids
AND transaction_date inside plan month/year
```

Income transaction:

```text
No effect on bucket actual_amount.
No automatic effect on plan available_amount.
```

Manual adjustment:

- User can edit manual plan `available_amount`.
- User can edit percentages for any source.
- Backend should not create custom categories or ask frontend to map categories.

## Acceptance Criteria

- User creates plan without manually picking categories.
- Backend maps transactions into `operational`, `fun`, `investing` buckets.
- Expense in `Makanan` reduces `fun`.
- Expense in `Belanja` reduces `operational`.
- Expense in `Investasi` reduces `investing`.
- Income does not reduce buckets and does not auto-recalculate snapshot plan.
- Manual source still works.
- Balance snapshot source still works.
- Total percent validation remains 100%.
