# AI Summary Planning

## Problem
Pekerja pribadi yang mencatat keuangan butuh cara cepat untuk tahu uang bocor di mana, sisa uang yang aman dipakai, dan langkah bulan depan. Tanpa ringkasan yang jelas, keputusan budget tetap harus dibaca manual dari banyak angka dan risiko boros berulang tetap tinggi.

## Evidence
- Assumption — needs validation via prototype.

## Users
- **Primary**: Pekerja pribadi yang mencatat transaksi, budget, dan goal untuk mengontrol cashflow bulanan.
- **Not for**: User yang butuh chat bebas dengan AI, auto-transfer uang, rekomendasi kredit/hutang, atau prediksi investasi.

## Hypothesis
We believe **AI Summary/Planning** will **help pekerja pribadi tahu kategori terboros, sisa aman, dan tindakan bulan depan** for **personal finance tracking users**.
We'll know we're right when **pengeluaran kategori terboros turun 10% bulan depan**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Penurunan pengeluaran kategori terboros | 10% bulan depan | Bandingkan total kategori terboros bulan ini vs bulan berikutnya |

## Scope
**MVP** — AI Summary untuk periode bulanan dan mingguan yang menampilkan 3 insight utama: bocor terbesar, sisa aman, dan saran tindakan. Hasil AI disimpan per user + periode, dengan refresh manual.

**Out of scope**
- Chat bebas dengan AI — ditunda karena mahal token dan belum dibutuhkan untuk validasi MVP.
- Auto-transfer uang — ditunda karena berisiko tinggi dan tidak perlu untuk summary/planning.
- Prediksi investasi — ditunda karena bukan problem utama.
- Rekomendasi kredit/hutang — ditunda karena butuh guardrail finansial tambahan.
- Refresh otomatis — ditunda untuk menghemat token dan menjaga biaya tetap terkendali.

## Delivery Milestones
<!-- Business outcomes, not engineering tasks. /plan turns each into a plan. -->
<!-- Status: pending | in-progress | complete -->

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | AI Summary Requirements | Product scope, placement, data policy, and cache rules are documented | pending | — |
| 2 | AI Summary Prototype | User can request monthly or weekly AI summary and see saved result | pending | — |
| 3 | AI Planning Feedback | User can use AI suggestion to adjust next budget decision | pending | — |

## Open Questions
- [ ] Model AI final apa yang dipakai? Default assumption: ChatGPT-compatible API.
- [ ] Data transaksi mentah boleh dikirim ke AI, tapi apakah perlu masking merchant/note sebelum production?
- [ ] Berapa lama hasil AI disimpan sebelum boleh refresh ulang?
- [ ] Apakah hasil AI perlu versi prompt/model agar bisa diaudit saat output berubah?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Biaya token naik karena refresh berulang | Medium | High | Simpan hasil per user + periode, refresh hanya manual, dan kirim data agregat dulu |
| AI memberi saran finansial terlalu percaya diri | Medium | Medium | Batasi output ke insight dan tindakan budgeting sederhana |
| Data transaksi sensitif terkirim ke AI | Medium | High | Minimalkan payload, redaksi field tidak perlu, dan dokumentasikan consent/data policy |
| Insight tidak berguna karena data transaksi sedikit | Medium | Medium | Tampilkan fallback bahwa data belum cukup dan sarankan tambah transaksi |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
