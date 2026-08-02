export function applyReceiptDiscount(amounts: number[], discount: number) {
  const grossAmounts = amounts.map((amount) => Math.max(1, Math.round(amount)));
  let remainingGross = grossAmounts.reduce((sum, amount) => sum + amount, 0);
  let remainingDiscount = Math.min(
    Math.max(0, Math.round(discount)),
    Math.max(0, remainingGross - grossAmounts.length),
  );

  return grossAmounts.map((amount, index) => {
    const futureCapacity = remainingGross - amount - (grossAmounts.length - index - 1);
    const minimumShare = Math.max(0, remainingDiscount - futureCapacity);
    const proportionalShare = remainingGross
      ? Math.round((remainingDiscount * amount) / remainingGross)
      : 0;
    const share = Math.min(amount - 1, Math.max(minimumShare, proportionalShare));
    remainingGross -= amount;
    remainingDiscount -= share;
    return amount - share;
  });
}

if (__DEV__) {
  console.assert(
    applyReceiptDiscount([100, 100], 50).join(',') === '75,75',
    'Receipt discount allocation must preserve net total',
  );
}
