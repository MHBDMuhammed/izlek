# İçerik Yazım Rehberi

Yeni metin `src/content/readings.ts` içindeki `add()` zincirine eklenir.
Mevcut metinlere dokunmadan, `export` satırından hemen önceye ekleyin.

## add() imzası

```ts
add(id, title, genre, level, complexity, body, questions, summary, points, extra?)
```

- `id`: `r41`, `r42`… benzersiz, sabit kimlik. Asla yeniden kullanmayın.
- `level`: 1 (kısa/temel), 2 (orta), 3 (yoğun). Bilinmiyorsa kullanıcı
  metni olarak ekleyin, hazır metne uydurma düzey vermeyin.
- `body`: paragraflar `\n\n` ile ayrılır. Kısa/orta metin 120–220 kelime,
  2 paragraf; uzun okuma 700–1.200 kelime, kendi içinde bütünlüklü.
- `complexity`: sözcük/cümle/ilişki/kavram yükünü bir cümleyle anlatın.

## Soru, kanıt, özet

- Her ölçüm metninde metne özel sorular; hazır şablon cümle yok.
- Beceri dengesi: Ana düşünce + (İlişki/Çıkarım) + (Açık bilgi/Bağlam).
- `answer` geçerli şık indeksi; `evidence` sorunun dayandığı paragraf indeksi.
- `why` bir cümlelik metne dayalı gerekçe; kanıt paragrafını gerçekten
  desteklemeli. Doğru şık uzunluğuyla/biçimiyle ele vermemeli.
- `summary` tek cümlelik örnek özet; `points` 2 maddelik fikir listesi
  (serbest özet öz değerlendirmesinde kullanılır, kelimesi kelimesine
  eşleşme aranmaz).

## Tür ve çeşitlilik

- Gündelik yaşam, kültür, doğa, tasarım, teknoloji, öğrenme, kurgu, süreç,
  düşünce yazıları dengeli olsun. Kurgu açıkça kurgu olarak anlaşılsın
  ("Bu öyküde…" gibi sinyal).
- Aynı örgüyü ("ekip varsayımını gözlemle değiştirdi") tekrarlamayın.
- Değerlendirme metinleri (`role` baseline/mid/final) pratik önizlemelerinde
  tüketilmez; yeni metin eklerken `role: "practice"` kullanın.

## Kontrol

```bash
pnpm typecheck && pnpm lint && pnpm test
```

`src/content.test.ts` kimlik, sürüm, soru/kanıt indeksleri, ders bağlantıları
ve uzun okuma alt sınırlarını korur.
