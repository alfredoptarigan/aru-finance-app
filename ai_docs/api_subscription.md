# Subscription API Contract

Kontrak API untuk frontend subscription. Base path:

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

## Types

```ts
type SubscriptionBillingCycle = 'weekly' | 'monthly' | 'yearly';

interface Subscription {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  amount: number;
  billing_cycle: SubscriptionBillingCycle;
  next_billing_date: string; // YYYY-MM-DD
  category: string;
  icon: string;
  color: string;
  payment_method_id: string | null;
  payment_method: string | null;
  auto_debit: boolean;
  is_active: boolean;
  reminder_days_before: number[];
  auto_create_transaction: boolean;
  created_at: string;
  updated_at: string;
}

interface SubscriptionSummary {
  monthly_total: number;
  active_count: number;
  total_count: number;
  due_today_count: number;
  due_this_week_count: number;
  nearest_due: {
    subscription_id: string;
    name: string;
    amount: number;
    next_billing_date: string;
    days_until: number;
  } | null;
}
```

## GET /subscriptions

List subscription milik user.

Query optional:

```ts
{
  is_active?: boolean;
  category?: string;
  due_before?: string; // YYYY-MM-DD
  due_after?: string; // YYYY-MM-DD
  search?: string;
}
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "sub_123",
      "user_id": "user_123",
      "name": "Netflix",
      "description": "Family plan",
      "amount": 46500,
      "billing_cycle": "monthly",
      "next_billing_date": "2026-07-25",
      "category": "Entertainment",
      "icon": "play-circle",
      "color": "#EF4444",
      "payment_method_id": "pm_123",
      "payment_method": "Rekening gaji",
      "auto_debit": true,
      "is_active": true,
      "reminder_days_before": [1, 0],
      "auto_create_transaction": false,
      "created_at": "2026-07-04T10:00:00.000Z",
      "updated_at": "2026-07-04T10:00:00.000Z"
    }
  ]
}
```

## GET /subscriptions/summary

Summary untuk hero card subscription.

Response:

```json
{
  "success": true,
  "data": {
    "monthly_total": 1036500,
    "active_count": 4,
    "total_count": 5,
    "due_today_count": 1,
    "due_this_week_count": 2,
    "nearest_due": {
      "subscription_id": "sub_123",
      "name": "Netflix",
      "amount": 46500,
      "next_billing_date": "2026-07-25",
      "days_until": 1
    }
  }
}
```

## GET /subscriptions/:id

Detail subscription.

Response:

```json
{
  "success": true,
  "data": {
    "id": "sub_123",
    "user_id": "user_123",
    "name": "Netflix",
    "description": "Family plan",
    "amount": 46500,
    "billing_cycle": "monthly",
    "next_billing_date": "2026-07-25",
    "category": "Entertainment",
    "icon": "play-circle",
    "color": "#EF4444",
    "payment_method_id": "pm_123",
    "payment_method": "Rekening gaji",
    "auto_debit": true,
    "is_active": true,
    "reminder_days_before": [1, 0],
    "auto_create_transaction": false,
    "created_at": "2026-07-04T10:00:00.000Z",
    "updated_at": "2026-07-04T10:00:00.000Z"
  }
}
```

## POST /subscriptions

Create subscription.

Request:

```json
{
  "name": "Netflix",
  "description": "Family plan",
  "amount": 46500,
  "billing_cycle": "monthly",
  "next_billing_date": "2026-07-25",
  "category": "Entertainment",
  "icon": "play-circle",
  "color": "#EF4444",
  "payment_method_id": "pm_123",
  "auto_debit": true,
  "is_active": true,
  "reminder_days_before": [1, 0],
  "auto_create_transaction": false
}
```

Required:

- `name`
- `amount`
- `billing_cycle`
- `next_billing_date`
- `category`

Defaults:

- `description`: `null`
- `icon`: `"card"`
- `color`: `"#6366F1"`
- `payment_method_id`: `null`
- `auto_debit`: `false`
- `is_active`: `true`
- `reminder_days_before`: `[1, 0]`
- `auto_create_transaction`: `false`

Response: `Subscription`.

## PUT /subscriptions/:id

Update subscription. Request is partial create payload.

Request:

```json
{
  "amount": 58000,
  "next_billing_date": "2026-08-25",
  "reminder_days_before": [3, 1, 0]
}
```

Response: updated `Subscription`.

## PATCH /subscriptions/:id/toggle

Toggle active status.

Request:

```json
{
  "is_active": false
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "sub_123",
    "is_active": false,
    "updated_at": "2026-07-04T12:00:00.000Z"
  }
}
```

## DELETE /subscriptions/:id

Delete subscription.

Response:

```json
{
  "success": true,
  "data": {
    "id": "sub_123",
    "deleted": true
  }
}
```

## GET /subscriptions/due-soon

Home card and reminder preview.

Query:

```text
GET /api/subscriptions/due-soon?days=7
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "sub_123",
      "name": "Netflix",
      "amount": 46500,
      "next_billing_date": "2026-07-25",
      "days_until": 1,
      "category": "Entertainment",
      "icon": "play-circle",
      "color": "#EF4444"
    }
  ]
}
```

## POST /notification-devices

Register Expo push token.

Request:

```json
{
  "token": "ExponentPushToken[xxxx]",
  "platform": "ios",
  "device_id": "optional-device-id"
}
```

Backend always stores:

```json
{
  "provider": "expo"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "nd_123",
    "user_id": "user_123",
    "provider": "expo",
    "token": "ExponentPushToken[xxxx]",
    "platform": "ios",
    "device_id": "optional-device-id",
    "is_active": true,
    "last_seen_at": "2026-07-04T10:00:00.000Z",
    "created_at": "2026-07-04T10:00:00.000Z"
  }
}
```

## DELETE /notification-devices/:id

Deactivate token on logout or revoked permission.

Response:

```json
{
  "success": true,
  "data": {
    "id": "nd_123",
    "is_active": false
  }
}
```

## Error Responses

Validation:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "amount": "Nominal harus lebih dari 0",
    "billing_cycle": "Billing cycle tidak valid"
  }
}
```

Not found:

```json
{
  "success": false,
  "error": "Subscription tidak ditemukan"
}
```

Unauthorized:

```json
{
  "success": false,
  "error": "Sesi kamu berakhir. Silakan login kembali."
}
```

## Frontend Cache Invalidation

After create, update, delete, or toggle, invalidate:

```text
subscriptions
subscriptions summary
due soon subscriptions
dashboard summary
insights
```

## Backend Rules

- Scope every query by authenticated `user_id`.
- Never trust `user_id` from request body.
- Return dates as `YYYY-MM-DD`.
- Return timestamps as ISO strings.
- Default reminder is `[1, 0]`.
- Push provider is Expo only.
- Store notification token in `notification_devices`.
- Scheduled reminders must use `subscription_reminder_logs` to prevent duplicate pushes.
