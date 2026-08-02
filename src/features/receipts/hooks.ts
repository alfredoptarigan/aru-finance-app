import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { ReceiptScan } from '@/types';

export interface ReceiptScanInput {
  image: string;
  media_type: string;
}

export function useScanReceipt() {
  return useMutation({
    mutationFn: (body: ReceiptScanInput) => api.post<ReceiptScan>('/receipts/scan', body),
  });
}
