import type { ParticipantBreakdown, SplitBillAdjustment, SplitBillBreakdown, SplitBillItem, SplitBillParticipant } from '@/types';

// Splits `amount` across `count` shares, giving the leftover Rupiah to the
// first `remainder` shares (by index) — mirrors the backend's rounding rule.
function splitEven(amount: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(amount / count);
  const remainder = amount - base * count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

// Distributes `total` proportionally to `weights`, using largest-remainder
// allocation so the parts always sum exactly to `total`.
function splitProportional(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0 || weightSum <= 0) return weights.map(() => 0);

  const raw = weights.map((w) => (w / weightSum) * total);
  const floors = raw.map(Math.floor);
  let short = total - floors.reduce((sum, v) => sum + v, 0);

  const order = raw
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);

  const shares = [...floors];
  for (const { index } of order) {
    if (short <= 0) break;
    shares[index] += 1;
    short -= 1;
  }
  return shares;
}

export function computeSplitBillBreakdown(
  participants: SplitBillParticipant[],
  items: SplitBillItem[],
  adjustments: SplitBillAdjustment[],
): SplitBillBreakdown {
  const order = participants.map((p) => p.id);
  const subtotals = new Map<string, number>(order.map((id) => [id, 0]));

  for (const item of items) {
    const assigned = order.filter((id) => item.participant_ids.includes(id));
    const shares = splitEven(item.amount, assigned.length);
    assigned.forEach((id, index) => {
      subtotals.set(id, (subtotals.get(id) ?? 0) + shares[index]);
    });
  }

  const itemsSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountTotal = adjustments.filter((a) => a.kind === 'discount').reduce((sum, a) => sum + a.amount, 0);
  const feeTotal = adjustments.filter((a) => a.kind === 'fee').reduce((sum, a) => sum + a.amount, 0);

  const discountShares = splitProportional(
    discountTotal,
    order.map((id) => subtotals.get(id) ?? 0),
  );
  const feeShares = splitEven(feeTotal, order.length);

  const breakdownParticipants: ParticipantBreakdown[] = participants.map((participant, index) => {
    const subtotal = subtotals.get(participant.id) ?? 0;
    const discountShare = discountShares[index] ?? 0;
    const feeShare = feeShares[index] ?? 0;
    return {
      participant_id: participant.id,
      name: participant.name,
      is_paid: participant.is_paid,
      subtotal,
      discount_share: discountShare,
      fee_share: feeShare,
      total: subtotal - discountShare + feeShare,
    };
  });

  return {
    participants: breakdownParticipants,
    items_subtotal: itemsSubtotal,
    discount_total: discountTotal,
    fee_total: feeTotal,
    grand_total: itemsSubtotal - discountTotal + feeTotal,
  };
}
