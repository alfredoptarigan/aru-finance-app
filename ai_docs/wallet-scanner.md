# Dompet & Scan Struk

Dipisah dari [`API.md`](../API.md) karena dua fitur ini dikembangkan bareng dan sering dipakai berurutan (scan struk -> pilih dompet -> buat transaksi).

Konvensi umum (base URL, header, format respons, kode status) mengikuti [`API.md#konvensi-umum`](../API.md#konvensi-umum) — tidak diulang di sini.

---

## Metode pembayaran (Dompet)

Tipe `type`: `cash` | `bank` | `e_wallet` | `credit_card` | `paylater`

### GET `/payment-methods`

List semua dompet milik user.

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "BCA",
      "type": "bank",
      "balance": 19115000,
      "account_number": "1234567890",
      "created_at": "..."
    }
  ]
}
```

### POST `/payment-methods`

Buat dompet baru.

**Body:**

```json
{
  "name": "BCA",
  "type": "bank",
  "account_number": "1234567890",
  "balance": 19115000
}
```

| Field | Tipe | Validasi |
|-------|------|----------|
| `name` | string | 1-50 karakter |
| `type` | enum | `cash` \| `bank` \| `e_wallet` \| `credit_card` \| `paylater` |
| `account_number` | string \| null | Opsional, maks 50 karakter |
| `balance` | number | Wajib |

**Response `201`:** sama seperti item pada `GET /payment-methods`.

### GET `/payment-methods/:id`

**Response `200`:** satu dompet. `404` jika tidak ditemukan/bukan milik user.

### PUT `/payment-methods/:id`

Body sama seperti `POST`, semua field opsional (partial update).

### DELETE `/payment-methods/:id`

**Response `204`**, body kosong.

---

## Scan Struk

### POST `/receipts/scan`

Baca foto/PDF struk dengan Gemini vision dan ekstrak toko, tanggal, item, serta diskon. Endpoint ini **tidak** langsung membuat transaksi — hasilnya berupa draft untuk direview di client, lalu tiap item yang dipilih dikirim sebagai transaksi terpisah lewat `POST /transactions` (lihat [`API.md#transaksi`](../API.md#transaksi)).

**Body:**

```json
{
  "image": "base64-encoded-file-tanpa-prefix-data-url",
  "media_type": "image/jpeg"
}
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `image` | string | Konten file di-encode base64 (tanpa prefix `data:...;base64,`) |
| `media_type` | string | MIME type asli file, mis. `image/jpeg`, `image/png`, atau `application/pdf` |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "store_name": "Indomaret",
    "transaction_date": "2026-05-16",
    "items": [
      { "name": "ABC ORANGE 525ML", "amount": 13500, "qty": 1 }
    ],
    "discounts": [
      { "name": "VOUCHER ABC SQUASH ORANGE", "amount": 3600 }
    ]
  }
}
```

`items[].amount` adalah harga total baris tersebut (bukan harga satuan). `discounts[].amount` selalu angka positif (nilai potongan).

**Response `422`** jika gambar gagal dibaca (blur, gelap, dsb):

```json
{
  "success": false,
  "error": "Gagal membaca struk. Coba foto ulang dengan pencahayaan lebih baik."
}
```
