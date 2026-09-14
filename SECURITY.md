# Güvenlik Politikası

İzlek tamamen yerelde çalışır; sunucu tarafı yoktur. Yine de yerel veri,
güvenilmeyen girdi (kullanıcı metni, JSON yedeği) ve bağımlılık zinciri
ciddiye alınır.

## Bildirim

GitHub **private vulnerability reporting** kanalını kullanın
(repo Security sekmesi). E-posta adresi, özel kanal veya yanıt süresi
vaat edilmez.

## Kapsam

- XSS (uygulama metni HTML olarak çalıştırmaz), prototype pollution,
  bozuk kayıt, veri kaybı, çok sekmeli yazışma, bağımlılık güvenliği.
- Test ve hata raporlarına gerçek kişisel içerik koymayın.

## Üretim notları

- `pnpm audit` temiz tutulur; bulgular üretim etkisiyle değerlendirilir.
- Statik sunum için örnek başlık politikası `docs/guvenlik-basliklari.md`
  içindedir. `Content-Security-Policy` gibi başlıklar sunucu/host katmanında
  uygulanır; tek sayfa uygulama kodu içinde vaat edilmez.
