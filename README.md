# İzlek

Amaçlı Türkçe okuma, anlama ve hatırlama için tamamen yerel eğitim uygulaması.

```bash
npm install
npm run dev
```

Vite geliştirme sunucusunun terminalde gösterdiği adresi açın. React ve TypeScript kullanılır. Fontlar ve bütün içerikler projedeki paketlerden sunulur; kurulumdan sonra harici servis veya internet bağlantısı gerekmez.

İçerik: dört aşamalı 16 derslik kitap, 40 özgün metin (6 uzun okuma, 6 ayrılmış değerlendirme metni), gerekçeli metne özel sorular, dokuz çalışma biçimi ve dört oyun. Ders anlatımı, karar ve pratik ayrı izlenir. Serbest özetler ve gecikmeli geri çağırma, açıkça öz değerlendirme olarak kaydedilir.

Kayıt: sürümlü localStorage. Son 200 okuma, 80 oyun, 40 hatırlama ve isteğe bağlı 10 kişisel metin. Tercihler ekranından JSON dışa/içe aktarımı ve bilinçli sıfırlama yapılır. Sekmeler arası değişiklikte kayıt yenileme uyarısı görünür.

Ölçüm: doğal okuma süresi soru süresinden ayrıdır. Kısmi veya 15 saniyeden kısa okumadan hız üretilmez. Rehber ve seri sunum tempoları doğal hız değildir. Kesinti, yardım ve maruziyet sonuçlarla birlikte gösterilir. İçerikler bilimsel olarak standartlaştırılmış testler değildir.

Bu teslimde test, lint, typecheck, build doğrulaması veya tarayıcı otomasyonu çalıştırılmadı. `src/core.ts` içindeki küçük `selfCheck` geliştirme amaçlı çalıştırılabilir bir sınır kontrolüdür; uygulama tarafından çağrılmaz ve teslim sırasında çalıştırılmadı.
