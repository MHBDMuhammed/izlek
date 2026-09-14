# İzlek 1.0.0 — kalite özeti (2026-09-14)

- İçerik: 16 ders, 40 pratik metin (r07–r46), 6 uzun okuma (r35–r40, 700–1.200 kelime), 6 değerlendirme metni.
- Komutlar: `pnpm install --frozen-lockfile`, `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`.
- Kontroller: typecheck ✓, lint ✓, 24 birim ✓, e2e chromium 4 + mobil 4 ✓, build ✓.
- Lighthouse masaüstü (yerel preview): açılış 100/100/100/63, kitap 99/100/100/63. SEO 63 kasıtlı `robots.txt` engelidir.
- Dış istek: üretim yapısında yalnızca aynı origin asset istekleri gözlendi.
- Bilinen sınır: Lighthouse laboratuvar ölçümüdür; saha verisi değildir.
