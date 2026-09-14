# Statik Sunum Güvenlik Başlıkları (örnek)

Bu başlıklar uygulama kodu içinde değil, statik host/sunucu katmanında
uygulanır. Aşağıdaki örnek nginx/host eşdeğeridir; CSP üretim etkisini
değerlendirmeden kopyalamayın.

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Sınırlar:

- Geliştirme sunucusunun HMR ihtiyacı üretim politikasından farklıdır;
  bu örnek yalnızca üretim statik sunumu içindir.
- Tek sayfa uygulama derin bağlantıları (`#/kitap/…`) için hostta
  `index.html` geri dönüşü yapılandırın; `robots.txt` kişisel alanları
  taramaya kapatır.
- Harici istek yokluğu, üretim yapısında tarayıcı ağ gözlemiyle doğrulandı
  (2026-09-14): yalnızca aynı origin asset istekleri.
