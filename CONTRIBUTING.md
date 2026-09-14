# Katkı Rehberi

Türkçe yazın; küçük, gözden geçirilebilir parçalar gönderin.

## Başlamadan

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Değişiklikten önce ilgili ekranı ve `src/core.ts` içindeki kayıt akışını okuyun.
Önceki "tamamlandı" ifadelerini doğrulanmış kabul etmeyin; `pnpm typecheck`,
`pnpm lint`, `pnpm test` ve `pnpm build` çalıştırın.

## Neler kabul edilir

- Eğitim değeri açık ders/metni iyileştirmeleri, ölçüm dürüstlüğü
  düzeltmeleri, erişilebilirlik ve performans iyileştirmeleri.
- Yeni okuma metni: `docs/icerik-rehberi.md` içindeki kimlik, tür, düzey,
  kelime sınırı, soru/kanıt/özet kurallarına uyar.

## Neler kabul edilmez

- Backend, veritabanı, hesap, uzak depolama, analytics, runtime yapay zekâ.
- IndexedDB/SQLite/veri servisi; persistence `localStorage` kalır.
- CDN/uzak font; PWA/servis çalışanı; SSR.
- İhtiyaçsız framework, state yöneticisi, UI sistemi, plugin mimarisi.

## Commit ve PR

- Conventional commit (`fix:`, `feat:`, `test:`, `chore:`, `docs:`), dar kapsamlı.
- PR şablonunu doldurun; hangi komutları çalıştırdığınızı yazın.
- Kişisel okuma içeriğini test/fixture'a koymayın; sentetik veri kullanın.
