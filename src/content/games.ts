export const gameInfo = [
  {
    id: "sequence",
    title: "Hikâyenin ipi",
    subtitle: "Dağılan anlatıyı yeniden ör.",
    skill: "Olay örgüsü",
    icon: "route",
    lesson: "l12",
    description:
      "Kartları seçip yukarı veya aşağı taşı. Zaman ipuçlarını ve nedenleri izleyerek anlatıyı kur. Üç turda üç, dört ve beş parçalı hikâyelerle ilerle.",
  },
  {
    id: "evidence",
    title: "Kanıt dedektifi",
    subtitle: "İddia ile dayanağı buluştur.",
    skill: "Çıkarım",
    icon: "search",
    lesson: "l08",
    description:
      "Bir çıkarım dosyasını tamamlamak için gereken iki kanıtı metin şeritlerinden seç. İlgisiz ama doğru ayrıntılara dikkat et. Üç dosyayı çöz.",
  },
  {
    id: "links",
    title: "Anlam köprüleri",
    subtitle: "Nedenden sonuca bir yol kur.",
    skill: "Anlam ilişkileri",
    icon: "link",
    lesson: "l07",
    description:
      "Sol taraftaki durumu, sağdaki sonucuyla eşleştir. Bir kaynak ve bir hedef seç. Üç turda giderek büyüyen ilişki ağını tamamla.",
  },
  {
    id: "memory",
    title: "Fikir hafızası",
    subtitle: "Sözcükleri değil, ilişkileri hatırla.",
    skill: "İlişkisel hatırlama",
    icon: "brain",
    lesson: "l11",
    description:
      "Önce kavram ve işlev çiftlerini incele. Kartlar kapandığında kavramı doğru işlevle buluştur. Aynı yazıları değil, anlamca bağlı çiftleri arıyorsun.",
  },
];
export const sequences = [
  {
    title: "Kayıp anahtar",
    cards: [
      "Ece kapıya geldiğinde anahtarını bulamadı.",
      "Sabah anahtarı alışveriş çantasına koyduğunu hatırladı.",
      "Çantanın iç cebini açınca anahtarı buldu.",
    ],
    why: "Önce sorun ortaya çıkıyor, sonra yer hatırlanıyor ve arama sonuç veriyor.",
  },
  {
    title: "Yağmur planı",
    cards: [
      "Ekip açık havada okuma buluşması düzenlemeyi planladı.",
      "Hava yağışlı olunca kapalı bir yer aramaya başladı.",
      "Mahalle evi o saatte boş olduğunu bildirdi.",
      "Buluşma yeni adreste yapıldı ve değişikliğin gerekçesi katılımcılara anlatıldı.",
    ],
    why: "İlk planı değiştiren yağmur, yer aramayı başlatıyor. Yer bulunmadan buluşma yapılamaz.",
  },
  {
    title: "Boş kalan sandalye",
    cards: [
      "Atölyedeki bir sandalye hep boş kalıyordu.",
      "Görevli, oturanların kısa süre sonra başka yere geçtiğini fark etti.",
      "Bir katılımcı sandalyenin sallandığını gösterdi.",
      "Ayak bağlantısı onarılıp sandalye yerine kondu.",
      "Sonraki buluşmada aynı sandalye bütün gün kullanıldı.",
    ],
    why: "Gözlemden sorun belirlemeye, oradan müdahale ve yeni gözleme geçiliyor.",
  },
];
export const evidenceCases = [
  {
    claim:
      "Deniz toplantıya hazırlanmış, fakat o gün sunum yapmayı beklemiyordu.",
    clues: [
      "Çantasında notlarla dolu bir dosya vardı.",
      "Oda ikinci kattaydı.",
      "Adı sunum için söylenince şaşırıp dosyasını aceleyle açtı.",
      "Masada üç bardak su duruyordu.",
    ],
    answers: [0, 2],
    why: "Dolu dosya hazırlığa; adı söylenince şaşırması beklenmeyen sunuma işaret eder. Oda ve bardak bilgileri doğru olsa da bu çıkarımı desteklemez.",
  },
  {
    claim:
      "Yeni duyurunun sorunu yalnızca görünürlük değil, bilgi ilişkisiydi.",
    clues: [
      "Duyuru mavi kâğıda basılmıştı.",
      "Çoğu kişi duyuruyu gördüğünü söyledi.",
      "Panonun yanında bir saksı vardı.",
      "Saat yazıyor ama hangi gruba ait olduğu anlaşılmıyordu.",
      "Binanın iki girişi vardı.",
    ],
    answers: [1, 3],
    why: "Görülmüş olması görünürlük açıklamasını sınırlar. Saatin gruba bağlanamaması ilişkisel sorunu gösterir.",
  },
  {
    claim:
      "Nermin eski kutunun izlerini korumak istiyor; amacı onu yeni gibi yapmak değil.",
    clues: [
      "Kutu küçük bir masanın üzerindeydi.",
      "Nermin kutuyu iki eliyle taşıdı.",
      "Zımparalama önerilince kapağın çiziklerinin silinmesini istemediğini söyledi.",
      "Kutunun içinde birkaç kâğıt vardı.",
      "Yalnızca menteşenin güvenle açılıp kapanmasını istedi.",
      "Görüşme öğleden sonra yapıldı.",
    ],
    answers: [2, 4],
    why: "Çizikleri koruma isteği görünüşün yenilenmesini dışlar; menteşe isteği işlevsel hedefi gösterir. Diğer ayrıntılar bu hedefi belirlemez.",
  },
];
export const linkRounds = [
  {
    title: "Gündelik nedenler",
    pairs: [
      [
        "Kayıt bağlantısı duyuruda görünmüyordu.",
        "Katılımcılar nasıl başvuracağını sordu.",
      ],
      [
        "Bank gün boyu güneşte kalıyordu.",
        "Dinlenmek isteyenler başka yere oturdu.",
      ],
      ["Kutunun altı ağır yükte esnedi.", "Tabana ek destek yerleştirildi."],
    ],
  },
  {
    title: "Metnin içindeki işler",
    pairs: [
      ["Yazar bir sav ileri sürdü.", "Gerekçeler bu savı destekledi."],
      ["Paragraf “ancak” ile devam etti.", "Önceki fikre bir sınır eklendi."],
      [
        "İki tarih farklı işlerin yanına yazıldı.",
        "Başvuru günü etkinlik günüyle ayrıldı.",
      ],
      [
        "Özet yalnızca örnekleri sıraladı.",
        "Örneklerin ortak düşüncesi görünmedi.",
      ],
    ],
  },
  {
    title: "Kararı değiştiren bilgi",
    pairs: [
      [
        "Hız artarken üç metinde anlama düştü.",
        "Tempo baskısı azaltılıp anlama pratiği seçildi.",
      ],
      [
        "Tekrar metinde okuma hızlandı.",
        "Tanıdıklık etkisi yeni metin gelişiminden ayrıldı.",
      ],
      [
        "Son paragrafın görevi söylenemedi.",
        "Anlamın koptuğu yere hedefli dönüldü.",
      ],
      [
        "Kapalı metinle temel bağ hatırlanamadı.",
        "Aktif geri çağırma ve kaynak kontrolü yapıldı.",
      ],
      [
        "Seyrek kalabalık kullanım geçişi daralttı.",
        "Gündelik düzeni koruyan geçici yerleşim kuruldu.",
      ],
    ],
  },
];
export const memoryRounds = [
  [
    ["Ön inceleme", "Okumadan önce genel yapıyı görmek"],
    ["Tarama", "Belirli bilgiyi bağlamıyla bulmak"],
    ["Özet", "Temel düşünce ve ilişkileri korumak"],
  ],
  [
    ["Ana düşünce", "Metnin konu hakkındaki temel yargısı"],
    ["Kanıt", "İddiaya dayanak sağlayan bilgi"],
    ["Koşul", "Sonucun geçerli olduğu sınır"],
    ["Gönderim", "Bir sözcüğün önceki bilgiye dönmesi"],
  ],
  [
    ["Gecikmeli hatırlama", "Zaman geçince metinsiz yeniden kurma"],
    ["Öz değerlendirme", "Kendi anlatını fikir listesiyle karşılaştırma"],
    ["Doğal okuma", "Normal paragraflarda kendi ilerlemen"],
    ["Rehber temposu", "Sunumun ayarlanmış ilerleme hızı"],
    ["Amaçlı dönüş", "Kopan anlam ilişkisini yeniden kurma"],
  ],
];
