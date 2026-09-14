<p align="center">
  <img src="public/favicon.svg" width="88" height="88" alt="İzlek logosu" />
</p>

<h1 align="center">İzlek</h1>

<p align="center">
  Amaçlı Türkçe okuma, anlama ve hatırlama için kişisel eğitim alanın.<br />
  <strong>Hesap yok. Sunucu yok. Takip yok. Verilerin cihazında.</strong>
</p>

<p align="center">
  <a href="https://github.com/MHBDMuhammed/izlek/actions/workflows/ci.yml"><img src="https://github.com/MHBDMuhammed/izlek/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="license: MIT" /></a>
</p>

<p align="center">
  <a href="https://izlek.mhbd.dev"><strong>Canlı uygulamayı aç</strong></a>
</p>

İzlek, amaçlı okuma, anlama ve hatırlama becerilerini birlikte çalıştıran açık
kaynak bir eğitim uygulamasıdır. Yalnızca hız göstermez; okuma amacı, dikkat,
akıcılık, anlama, değerlendirme ve hatırlamayı gerçek Türkçe metinler üzerinde
birlikte geliştirir.

Uygulama React, TypeScript ve Vite ile hazırlanmış tamamen statik bir
frontend'dir. Backend, kullanıcı hesabı, analitik veya harici içerik servisi
kullanmaz. Kayıt `localStorage` içinde tutulur; temel işlevler ilk kurulumdan
sonra internet bağlantısı olmadan çalışır.

## Neler var?

- Dört aşamalı 16 derslik okuma kitabı: anlatım, çözülmüş örnek, anlam kararı, yeni metinde pratik
- 40 özgün Türkçe okuma metni (6 uzun okuma, 6 ayrılmış değerlendirme metni), metne özel gerekçeli sorular
- 9 çalışma biçimi: doğal okuma, rehberli tempo, anlam grupları, seri sunum, göz gezdirme, bilgi tarama ve daha fazlası
- 4 anlam oyunu: anlatı sıralama, kanıt bulma, ilişki eşleştirme, ilişkisel hafıza
- Günlük öneri, gecikmeli hatırlama, ara/bitirme değerlendirmeleri, kişisel çalışma düzeni
- Kendi metninle çalışma: yalnızca düz metin, hazır soru yok, anlama puanı üretilmez

## Neler yok?

Hız yarışı, bilimsel standart test iddiası, bulut eşitleme, PWA/servis çalışanı,
sunucu taraflı işlem. Ders anlatımı, karar ve pratik ayrı izlenir; serbest
özetler ve gecikmeli geri çağırma açıkça öz değerlendirme olarak kaydedilir.

## Gereksinimler

- Node.js `^24.0.0` (Active LTS önerilir; Vite 8 en az `^20.19.0 || >=22.12.0` ister)
- pnpm `12.4.1` (`packageManager` alanında sabitlidir; Corepack'e güvenmeyin)

Kurulum (2026-09-14 güncellik kontrolü; kararlı sürümler):

| Paket | Sürüm |
|---|---|
| react, react-dom, @types/react, @types/react-dom | 19.3.0 |
| vite | 8.3.0 |
| @vitejs/plugin-react | 6.1.1 |
| typescript | 6.0.3 |
| eslint / typescript-eslint / eslint-plugin-react-hooks | 10.10.0 / 8.70.0 / 7.1.1 |
| vitest | 5.0.0 |
| @playwright/test | 1.63.0 |
| pnpm | 12.4.1 |

## Kurulum ve komutlar

```bash
pnpm install --frozen-lockfile
pnpm dev        # geliştirme sunucusu
pnpm build      # üretim çıktısı (dist/)
pnpm preview    # üretim çıktısını yerelde sunma
pnpm typecheck  # tsc --noEmit
pnpm lint       # eslint .
pnpm test       # vitest run (birim)
pnpm test:e2e   # playwright test (uçtan uca, chromium + mobil)
```

`pnpm-workspace.yaml` içinde dar kapsamlı bir `minimumReleaseAge` istisnası
vardır: kurulum günü yayınlanan `lucide-react@1.46.0` için. Genel politika
gevşetilmedi; `pnpm approve-builds` çıktısında bekleyen kurulum betiği yoktur
(esbuild için dar `allowBuilds` izni).

## İçerik kapsamı

- Dersler: 4 aşama, 16 ders (`src/content/lessons.ts`).
- Metinler: 40 okuma (`src/content/readings.ts` + `long.ts`); kelime sayıları
  `src/text.ts` içindeki merkezi Türkçe sayımla üretilir ve testlerle korunur.
- Değerlendirme metinleri pratik önizlemelerinde tüketilmez; ara/bitirme
  ekranları henüz açılmamış metni önerir.
- Oyunlar: anlatı sıralama, kanıt bulma, ilişki eşleştirme, ilişkisel hafıza
  (`src/content/games.ts`). Oyun doğruluğu okuma ölçümlerinden ayrı tutulur.

## Ölçüm ve kayıt sınırları

- Doğal okuma süresi soru süresinden ayrıdır; monotonik saat (`performance.now`)
  kullanılır. Sekme gizleme/odak kaybı okumayı kesintili işaretler.
- 15 saniyeden kısa veya kısmi okumadan hız üretilmez. Rehber/seri/grup
  sunum tempoları doğal hız değildir; sonuçta açıkça etiketlenir.
- Karşılaştırılabilir kayıt: tam metin, doğal mod, yardımsız, kesintisiz,
  ilk maruziyet, 15 sn+. Diğer kayıtlar grafikten ayrı tutulur.
- Saklama: son 200 oturum, 80 oyun, 40 hatırlama, 10 kişisel metin. Budama,
  tamamlanmış ders göstergesini bozmaz (kalıcı özetler ham geçmişten ayrıdır).
- Çatışma: ikinci sekme yazmadan önce uyarı verir; bekleyen sonuç ekranda
  korunur ve "Yeni kaydı al" sonrası yeniden kaydedilebilir.
- Yedek: Tercihler ekranından JSON dışa/içe aktarım; içe aktarma önce doğrulanır,
  geçersiz dosya mevcut kaydı değiştirmez. Kritik işlemler erişilebilir
  onay penceresinden geçer.

## Tarayıcı desteği ve gizlilik

- Güncel masaüstü ve mobil tarayıcılar; kurulumdan sonra internet gerekmez
  (fontlar, ikonlar, içerik yereldir). Kişisel okuma kayıtları, özetler ve
  kullanıcı metinleri cihazdan çıkmaz.
- Canlı adres: https://izlek.mhbd.dev (statik sunum; kişisel veriler yine
  cihazında kalır). Kişisel günlük/özet/kullanıcı metni indekslenecek içerik
  değildir; `public/robots.txt` varsayılan olarak taramaya kapalıdır.

## Katkı ve güvenlik

- Katkı rehberi: `CONTRIBUTING.md`; içerik yazım kuralları:
  `docs/icerik-rehberi.md`. Davranış kuralları: `CODE_OF_CONDUCT.md`.
- Güvenlik bildirimi: `SECURITY.md` (GitHub private vulnerability reporting;
  e-posta veya özel kanal vaat edilmez).
- Sürüm notları: `CHANGELOG.md`.

## Doğrulama (2026-09-14)

- `pnpm typecheck`, `pnpm lint`, `pnpm test` (24 birim), `pnpm test:e2e`
  (chromium + mobil, 8 geçiş), `pnpm build` geçti.
- Lighthouse (masaüstü, yerel `pnpm preview`): açılış 100/100/100/63,
  kitap 99/100/100/63. SEO 63 yalnızca kasıtlı `robots.txt` engelidir;
  laboratuvar ölçümüdür, saha verisi değildir.
- Ekran okuyucu akışı klavye + başlık/Landmark kontrolleriyle gözden geçirildi;
  zamanlı sunumların yanında durağan metin yolu bulunur.
