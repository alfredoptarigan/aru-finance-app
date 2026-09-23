# Split Bill untuk React Native

Panduan implementasi fitur Split Bill di aplikasi React Native menggunakan REST API Aru Finance.

## Tujuan fitur

Split Bill membagi total struk ke beberapa peserta sampai tepat ke Rupiah terakhir.

Pengguna dapat:

- Membuat bill dari kamera, file gambar, PDF, atau input manual.
- Memeriksa dan memperbaiki hasil OCR sebelum disimpan.
- Menambah atau menghapus peserta.
- Menetapkan satu item ke satu atau beberapa peserta.
- Menambah diskon dan biaya.
- Melihat pembagian per peserta secara langsung.
- Menyimpan dan melanjutkan draft.
- Memfinalisasi bill agar nominal terkunci.
- Menandai peserta lunas atau belum bayar.
- Menyalin atau membagikan ringkasan melalui fitur native React Native.
- Membuka riwayat dan menghapus bill.

## Batas fitur v1

- Auth wajib memakai Supabase access token.
- Mata uang hanya `IDR`.
- Semua nominal dikirim sebagai angka Rupiah tanpa simbol atau pemisah ribuan.
- Foto atau PDF hanya dipakai saat OCR, tidak disimpan.
- Peserta berupa nama bebas, bukan akun atau kontak reusable.
- Tidak ada link publik, avatar upload, pembayaran parsial, atau pembagian fee khusus.
- Bill tidak otomatis membuat transaksi expense/income.
- Tidak ada autosave. Pengguna harus menekan **Simpan Draft**.

## Auth dan format API

Base URL:

```text
https://<domain>/api
```

Header semua endpoint:

```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

Respons berhasil, kecuali `DELETE`:

```json
{
  "success": true,
  "data": {}
}
```

Respons gagal:

```json
{
  "success": false,
  "error": "Pesan error",
  "details": {}
}
```

Status umum:

| Status | Arti |
|---|---|
| `200` | Request berhasil |
| `201` | Draft berhasil dibuat |
| `204` | Bill berhasil dihapus, tanpa response body |
| `401` | Token tidak ada, invalid, atau kedaluwarsa |
| `404` | Bill tidak ditemukan atau bukan milik user |
| `422` | Payload invalid, OCR gagal, edit final ditolak, atau finalisasi gagal |
| `500` | Error server |

## Model data

### SplitBillParticipant

```ts
export type SplitBillParticipant = {
  id: string;
  name: string;
  is_paid: boolean;
};
```

- `id` dibuat client dan harus stabil selama proses edit.
- Peserta awal direkomendasikan `{ name: "Saya", is_paid: false }`.
- Nama wajib 1-100 karakter saat payload divalidasi.
- Semua peserta baru mulai dengan `is_paid: false`.

### SplitBillItem

```ts
export type SplitBillItem = {
  id: string;
  name: string;
  qty: number;
  amount: number;
  participant_ids: string[];
};
```

- `amount` adalah total satu baris, bukan harga satuan.
- `qty` integer minimal `1`.
- `amount` harus lebih besar dari `0`.
- Satu peserta berarti peserta membayar seluruh item.
- Beberapa peserta berarti item dibagi rata.
- Item tanpa peserta boleh ada di draft, tetapi finalisasi akan ditolak.

### SplitBillAdjustment

```ts
export type SplitBillAdjustment = {
  id: string;
  name: string;
  kind: "discount" | "fee";
  amount: number;
};
```

- `amount` selalu positif atau `0`.
- `discount` dikurangkan dari subtotal.
- `fee` ditambahkan ke subtotal.

### SplitBillData

```ts
export type SplitBillData = {
  participants: SplitBillParticipant[];
  items: SplitBillItem[];
  adjustments: SplitBillAdjustment[];
};
```

### SplitBill

```ts
export type SplitBill = {
  id: string;
  user_id: string;
  merchant_name: string;
  bill_date: string;
  currency: "IDR";
  receipt_total: number;
  status: "draft" | "final";
  data: SplitBillData;
  created_at: string;
  updated_at: string;
};
```

Status tampilan diturunkan dari data:

```ts
export function getSplitBillDisplayStatus(bill: SplitBill) {
  if (bill.status === "draft") return "Draft";
  return bill.data.participants.every((participant) => participant.is_paid)
    ? "Selesai"
    : "Final";
}
```

`Selesai` bukan status DB. Nilai tersebut berarti bill `final` dan semua peserta `is_paid: true`.

### Breakdown

```ts
export type ParticipantBreakdown = {
  participant_id: string;
  name: string;
  is_paid: boolean;
  subtotal: number;
  discount_share: number;
  fee_share: number;
  total: number;
};

export type SplitBillBreakdown = {
  participants: ParticipantBreakdown[];
  items_subtotal: number;
  discount_total: number;
  fee_total: number;
  grand_total: number;
};
```

## Daftar API

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/split-bills?page=1&limit=20` | Ambil riwayat |
| `POST` | `/api/split-bills` | Buat draft |
| `GET` | `/api/split-bills/:id` | Ambil detail dan breakdown |
| `PUT` | `/api/split-bills/:id` | Ubah draft |
| `DELETE` | `/api/split-bills/:id` | Hapus bill |
| `POST` | `/api/split-bills/:id/finalize` | Validasi dan kunci bill |
| `PATCH` | `/api/split-bills/:id` | Ubah status lunas peserta |
| `POST` | `/api/split-bills/scan` | OCR gambar atau PDF |

## Detail API

### Ambil riwayat

```http
GET /api/split-bills?page=1&limit=20
```

Query:

| Field | Default | Batas |
|---|---:|---:|
| `page` | `1` | Minimal `1` |
| `limit` | `20` | `1-100` |

Urutan hasil: `bill_date` terbaru, lalu `created_at` terbaru.

Response `200`:

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

Gunakan untuk screen **Riwayat Split Bill**. Tampilkan merchant, tanggal, total struk, dan status tampilan.

### Buat draft

```http
POST /api/split-bills
```

Request:

```json
{
  "merchant_name": "Kopi Tuku",
  "bill_date": "2026-08-05",
  "currency": "IDR",
  "receipt_total": 68000,
  "data": {
    "participants": [
      { "id": "participant-1", "name": "Saya", "is_paid": false },
      { "id": "participant-2", "name": "Rani", "is_paid": false }
    ],
    "items": [
      {
        "id": "item-1",
        "name": "Es Kopi Susu",
        "qty": 2,
        "amount": 60000,
        "participant_ids": ["participant-1", "participant-2"]
      }
    ],
    "adjustments": [
      { "id": "fee-1", "name": "Service", "kind": "fee", "amount": 8000 }
    ]
  }
}
```

Response `201`: `data` berisi `SplitBill` dengan `status: "draft"`.

Catatan:

- `bill_date` wajib format `YYYY-MM-DD`.
- `currency` hanya menerima `IDR`.
- Jika `participants` kosong, backend membuat peserta default `Saya`.
- Simpan `data.id`, lalu navigasi ke screen detail.

### Ambil detail

```http
GET /api/split-bills/:id
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "bill": {
      "id": "bill-id",
      "user_id": "user-id",
      "merchant_name": "Kopi Tuku",
      "bill_date": "2026-08-05",
      "currency": "IDR",
      "receipt_total": 68000,
      "status": "draft",
      "data": {
        "participants": [],
        "items": [],
        "adjustments": []
      },
      "created_at": "2026-08-05T10:00:00.000Z",
      "updated_at": "2026-08-05T10:00:00.000Z"
    },
    "breakdown": {
      "participants": [],
      "items_subtotal": 0,
      "discount_total": 0,
      "fee_total": 0,
      "grand_total": 0
    }
  }
}
```

Gunakan breakdown server untuk detail tersimpan. Kalkulasi lokal hanya untuk preview editor.

### Ubah draft

```http
PUT /api/split-bills/:id
```

Request menerima field top-level parsial:

```json
{
  "merchant_name": "Nama merchant baru",
  "receipt_total": 70000
}
```

Jika mengirim `data`, kirim struktur `participants`, `items`, dan `adjustments` lengkap.

Response:

- `200`: `data` berisi draft terbaru.
- `404`: bill tidak ditemukan atau bukan milik user.
- `422`: bill sudah final dan tidak boleh diedit.

### Finalisasi

```http
POST /api/split-bills/:id/finalize
```

Tidak membutuhkan request body.

Response `200`: `data` berisi `SplitBill` dengan `status: "final"`.

Response `422`:

```json
{
  "success": false,
  "error": "Bill belum bisa difinalisasi",
  "details": {
    "errors": [
      "Item \"Es Kopi Susu\" belum punya peserta.",
      "Total hasil hitung (67000) tidak cocok dengan total struk (68000)."
    ]
  }
}
```

Finalisasi ditolak jika:

- Tidak ada peserta.
- Nama peserta kosong.
- Nama peserta duplikat, case-insensitive.
- Tidak ada item.
- Nominal item tidak valid.
- Ada item tanpa peserta.
- Total diskon melebihi subtotal item.
- Hasil pembagian tidak sama dengan `receipt_total`.

Setelah berhasil, nonaktifkan semua input merchant, tanggal, total, peserta, item, diskon, dan fee.

### Ubah status pembayaran peserta

```http
PATCH /api/split-bills/:id
```

Request:

```json
{
  "participant_id": "participant-2",
  "is_paid": true
}
```

Response `200`: `data` berisi `SplitBill` terbaru.

Aturan client:

- Tampilkan aksi ini hanya pada bill `final`.
- Optimistic update boleh, tetapi rollback jika request gagal.
- Saat semua peserta lunas, label list berubah menjadi `Selesai`.

> Catatan backend saat ini: handler belum memverifikasi status bill `final` dan belum memberi error saat `participant_id` tidak ada. Client tetap harus mengikuti kontrak fitur di atas.

### Hapus bill

```http
DELETE /api/split-bills/:id
```

Response berhasil `204 No Content`. Jangan panggil `response.json()`.

Draft dan bill final dapat dihapus. Selalu tampilkan confirmation dialog karena penghapusan permanen.

### Scan struk

```http
POST /api/split-bills/scan
```

Request:

```json
{
  "file": "<base64-tanpa-data-url-prefix>",
  "media_type": "image/jpeg"
}
```

Contoh MIME type:

- `image/jpeg`
- `image/png`
- `image/webp`
- `application/pdf`

Response `200`:

```json
{
  "success": true,
  "data": {
    "merchant_name": "Kopi Tuku",
    "bill_date": "2026-08-05",
    "items": [
      { "name": "Es Kopi Susu", "qty": 2, "amount": 60000 }
    ],
    "discounts": [
      { "name": "Voucher", "amount": 5000 }
    ],
    "fees": [
      { "name": "Service", "amount": 8000 }
    ],
    "grand_total": 63000
  }
}
```

Mapping hasil OCR ke editor:

```ts
const editorData: SplitBillData = {
  participants: currentParticipants,
  items: scan.items.map((item) => ({
    id: createStableId(),
    name: item.name,
    qty: item.qty,
    amount: item.amount,
    participant_ids: [],
  })),
  adjustments: [
    ...scan.discounts.map((discount) => ({
      id: createStableId(),
      name: discount.name,
      kind: "discount" as const,
      amount: discount.amount,
    })),
    ...scan.fees.map((fee) => ({
      id: createStableId(),
      name: fee.name,
      kind: "fee" as const,
      amount: fee.amount,
    })),
  ],
};
```

OCR bukan sumber kebenaran. User harus dapat mengoreksi semua hasil sebelum menyimpan.

Catatan upload:

- Kirim base64 murni, bukan string `data:image/jpeg;base64,...`.
- Endpoint belum menetapkan batas ukuran atau allowlist MIME khusus.
- Kompres foto di client dan cegah file terlalu besar agar request tidak gagal di proxy atau hosting.
- Tampilkan fallback input manual saat OCR gagal.

## Aturan kalkulasi

Backend menjadi sumber kebenaran untuk breakdown tersimpan dan finalisasi.

### Item

Setiap `amount` item dibagi rata ke peserta pada `participant_ids`.

Contoh Rp10.000 untuk 3 peserta:

```text
Peserta 1: Rp3.334
Peserta 2: Rp3.333
Peserta 3: Rp3.333
```

Sisa Rupiah diberikan ke peserta pertama berdasarkan urutan `data.participants`.

### Diskon

Total diskon dibagi proporsional berdasarkan subtotal item tiap peserta. Pembulatan memakai largest-remainder allocation agar total bagian diskon tetap tepat.

### Fee

Semua fee dibagi rata ke seluruh peserta, termasuk peserta tanpa item. Sisa Rupiah mengikuti urutan peserta.

### Rumus total peserta

```text
total = subtotal - discount_share + fee_share
```

Invariant wajib:

```text
sum(participant.total) = items_subtotal - discount_total + fee_total
```

Saat finalisasi, nilai tersebut juga wajib sama dengan `receipt_total`.

## Flow aplikasi

### Riwayat

```text
Buka Split Bill
  -> GET /api/split-bills?page=1&limit=20
  -> loading skeleton
  -> empty state atau daftar bill
  -> pilih bill untuk detail
  -> atau tekan Buat Baru
```

Daftar menampilkan:

- Merchant, fallback `Tanpa nama`.
- Tanggal bill.
- Total struk.
- Status `Draft`, `Final`, atau `Selesai`.
- Pagination sebelumnya dan selanjutnya.
- Aksi hapus dengan konfirmasi.

### Buat dari kamera atau file

```text
Buat Baru
  -> pilih Kamera, Galeri, File, atau Isi Manual
  -> baca file sebagai base64
  -> POST /api/split-bills/scan
  -> tampilkan loading OCR
  -> isi editor dari response
  -> user review dan koreksi
  -> tambah peserta
  -> assign tiap item
  -> preview pembagian dan selisih
  -> POST /api/split-bills
  -> navigasi ke detail draft
```

Jangan langsung finalisasi hasil OCR. OCR dapat salah membaca nama, tanggal, kuantitas, nominal, diskon, fee, atau grand total.

### Buat manual

```text
Buat Baru
  -> Isi Manual
  -> isi merchant, tanggal, total struk
  -> tambah peserta
  -> tambah item
  -> assign item
  -> tambah diskon atau fee bila ada
  -> preview pembagian dan selisih
  -> POST /api/split-bills
```

Item manual baru dapat default ke semua peserta. Item hasil OCR harus mulai tanpa assignment agar user memeriksa pembagian.

### Edit draft

```text
Buka detail
  -> GET /api/split-bills/:id
  -> status draft
  -> input aktif
  -> edit data
  -> PUT /api/split-bills/:id
  -> refresh detail dan list cache
```

### Finalisasi

```text
Detail draft tersimpan
  -> tekan Finalisasi
  -> pastikan perubahan terakhir sudah PUT
  -> POST /api/split-bills/:id/finalize
  -> tampilkan semua details.errors jika 422
  -> jika berhasil, ubah screen ke read-only
```

Bill baru harus disimpan dulu karena finalisasi membutuhkan `id`.

### Pembayaran

```text
Detail final
  -> tampilkan total tiap peserta
  -> toggle Lunas atau Belum Bayar
  -> PATCH /api/split-bills/:id
  -> refresh detail dan list
  -> semua lunas menghasilkan status Selesai
```

### Salin atau bagikan ringkasan

Format minimum:

```text
Kopi Tuku - 2026-08-05
Total: Rp68.000

Saya: Rp34.000 (Lunas)
Rani: Rp34.000 (Belum bayar)
```

Gunakan `Share.share()` untuk native share sheet. Clipboard dapat ditambahkan jika aplikasi sudah memiliki util clipboard. Tidak perlu integrasi WhatsApp khusus.

## Struktur screen React Native

### SplitBillListScreen

- Fetch list dengan pagination.
- Pull to refresh.
- Loading skeleton.
- Empty state dengan CTA **Buat Baru**.
- Status badge.
- Delete confirmation.

### SplitBillSourceScreen atau bottom sheet

- Ambil foto.
- Pilih gambar.
- Pilih PDF.
- Isi manual.
- Permission denied state.
- OCR loading dan error fallback.

### SplitBillEditorScreen

- Info bill: merchant, tanggal, total struk.
- Daftar peserta.
- Daftar item dan assignment peserta.
- Daftar diskon dan fee.
- Breakdown preview.
- Indikator selisih `receipt_total - breakdown.grand_total`.
- Aksi simpan draft dan finalisasi.
- Semua input read-only setelah final.

### SplitBillDetailScreen

- Breakdown server.
- Nominal dan status pembayaran tiap peserta.
- Toggle pembayaran hanya untuk final.
- Native share.
- Delete confirmation.

## State UI wajib

| State | Perilaku |
|---|---|
| Loading list | Skeleton sesuai bentuk row |
| Empty list | Penjelasan dan CTA Buat Baru |
| Loading detail | Skeleton editor/detail |
| Not found | Pesan bill tidak ditemukan dan kembali ke list |
| OCR loading | Kunci tombol scan untuk mencegah request ganda |
| OCR error | Pesan kontekstual dan opsi isi manual |
| Save loading | Disable Simpan Draft |
| Finalize loading | Disable Finalisasi |
| Validation error | Tampilkan semua `details.errors` dekat ringkasan |
| Offline/network error | Pertahankan isi form, beri aksi coba lagi |
| Delete loading | Disable konfirmasi ganda |

## Cache dan invalidation

Minimal cache key:

```ts
export const splitBillKeys = {
  all: ["split-bills"] as const,
  list: (page: number) => ["split-bills", "list", page] as const,
  detail: (id: string) => ["split-bills", "detail", id] as const,
};
```

Invalidasi:

| Mutation | Cache |
|---|---|
| Create | Semua list |
| Update draft | Semua list dan detail bill |
| Finalize | Semua list dan detail bill |
| Toggle paid | Semua list dan detail bill |
| Delete | Semua list, lalu keluar dari detail |

## Validasi client

Validasi client untuk feedback cepat, bukan pengganti validasi server:

- Format tanggal `YYYY-MM-DD`.
- Nominal berupa integer Rupiah dan tidak negatif.
- Item minimal satu.
- Peserta minimal satu.
- Nama peserta terisi dan unik setelah `trim().toLowerCase()`.
- Setiap item punya minimal satu peserta.
- Total diskon tidak melebihi subtotal item.
- Preview total sama dengan total struk sebelum tombol finalisasi aktif.

Tetap render error server karena kontrak backend menjadi sumber kebenaran.

## Accessibility dan UX mobile

- Semua input memiliki label terlihat, bukan placeholder saja.
- Assignment avatar memiliki accessibility label seperti `Pilih Rani untuk Es Kopi Susu`.
- Status tidak disampaikan lewat warna saja. Tampilkan teks `Draft`, `Final`, `Selesai`, `Lunas`, atau `Belum Bayar`.
- Gunakan touch target minimal 44x44.
- Konfirmasi sebelum delete.
- Hormati text scaling dan reduced motion.
- Pertahankan form saat keyboard, OCR, save, atau request gagal.

## Checklist implementasi

- [ ] Bearer token terpasang pada semua request.
- [ ] Screen list, source picker, editor, dan detail tersedia.
- [ ] Kamera, image picker, dan document picker menghasilkan base64 murni.
- [ ] OCR selalu masuk ke review editor.
- [ ] Peserta dan item memakai ID stabil.
- [ ] Assignment multi-peserta dapat diubah.
- [ ] Preview memakai aturan pembulatan yang sama dengan backend.
- [ ] Draft tersimpan sebelum finalisasi.
- [ ] Finalisasi `422` menampilkan semua `details.errors`.
- [ ] Bill final read-only selain `is_paid`.
- [ ] Native share memakai ringkasan final.
- [ ] Delete menangani response `204` tanpa parsing JSON.
- [ ] Loading, empty, error, offline, dan not-found state tersedia.
- [ ] Cache list/detail di-invalidasi setelah mutation.

## Sumber implementasi backend

- `app/api/split-bills/route.ts`
- `app/api/split-bills/[id]/route.ts`
- `app/api/split-bills/[id]/finalize/route.ts`
- `app/api/split-bills/scan/route.ts`
- `lib/validations/split-bill.schema.ts`
- `lib/services/split-bills.service.ts`
- `lib/utils/split-bill-calculator.ts`


