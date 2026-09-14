import { lazy, Suspense, useEffect, useState } from "react";
import {
  BookOpen,
  House,
  Route,
  Layers3,
  Shapes,
  LibraryBig,
  ChartNoAxesCombined,
  Settings2,
  ArrowUpRight,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  X,
  ChevronRight,
  Leaf,
  Clock3,
  Check,
  Brain,
} from "lucide-react";
import {
  useStore,
  recommend,
  lessonDone,
  modes,
  type Store,
  type Recommendation,
} from "./core";
import type { Mode } from "./content/types";
const Panels = lazy(() => import("./components/Panels"));
export interface RouteState {
  view: string;
  id?: string;
  mode?: Mode;
  lessonId?: string;
  assessment?: "baseline" | "mid" | "final";
}
export type Navigate = (
  view: string,
  id?: string,
  extra?: Partial<Omit<RouteState, "view" | "id">>,
) => void;
const routeViews = [
  "home",
  "course",
  "book",
  "studio",
  "games",
  "library",
  "progress",
  "settings",
  "onboarding",
  "assessment",
  "recall",
  "custom",
  "reader",
  "recommended",
] as const;
function isRouteView(value: string): value is (typeof routeViews)[number] {
  return routeViews.some((candidate) => candidate === value);
}
function isModeValue(value: string): value is Mode {
  return modes.some((candidate) => candidate === value);
}
function isAssessmentValue(
  value: string,
): value is NonNullable<RouteState["assessment"]> {
  return value === "baseline" || value === "mid" || value === "final";
}
function parseRoute(): RouteState {
  try {
    const raw = location.hash.slice(1) || "home";
    const [path, query] = raw.split("?") ?? [];
    const safePath = path ?? "home";
    const [view, id] = safePath.split("/");
    const safeView = view ?? "home";
    const params = new URLSearchParams(query ?? "");
    const mode = params.get("mode");
    const assessment = params.get("assessment");
    return {
      view: isRouteView(safeView) ? safeView : "home",
      id: id ? decodeURIComponent(id) : undefined,
      mode: mode && isModeValue(mode) ? mode : undefined,
      lessonId: params.get("lessonId") || undefined,
      assessment:
        assessment && isAssessmentValue(assessment) ? assessment : undefined,
    };
  } catch {
    return { view: "home" };
  }
}
const nav = [
  { id: "home", label: "Bugün", icon: House },
  { id: "course", label: "Öğrenme yolu", icon: Route },
  { id: "book", label: "Okuma kitabı", icon: BookOpen },
  { id: "studio", label: "Antrenman stüdyosu", icon: Layers3 },
  { id: "games", label: "Anlam oyunları", icon: Shapes },
  { id: "library", label: "Metin kütüphanesi", icon: LibraryBig },
  { id: "progress", label: "Gelişim günlüğü", icon: ChartNoAxesCombined },
];
export default function App() {
  const store = useStore();
  const [route, setRoute] = useState(parseRoute);
  const [menu, setMenu] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const handler = () => {
      setRoute(parseRoute());
      setMenu(false);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = store.state.prefs.theme;
    document.documentElement.style.colorScheme = store.state.prefs.theme;
  }, [store.state.prefs.theme]);
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${nav.find((n) => n.id === route.view)?.label || "Çalışma alanı"} · İzlek`;
  }, [route.view, route.id]);
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const go: Navigate = (view, id, extra) => {
    const p = new URLSearchParams();
    Object.entries(extra || {}).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    location.hash = `${view}${id ? "/" + encodeURIComponent(id) : ""}${p.size ? "?" + p.toString() : ""}`;
  };
  const focusMode = ["reader", "custom", "recommended"].includes(route.view);
  const current = nav.find((n) => n.id === route.view);
  const completed = Array.from(
    { length: 16 },
    (_, i) => `l${String(i + 1).padStart(2, "0")}`,
  ).filter((id) => lessonDone(store.state, id)).length;
  return (
    <div className={`app-shell ${focusMode ? "focus-shell" : ""}`}>
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        İçeriğe geç
      </a>
      {!focusMode && (
        <>
          <div
            className={`mobile-backdrop ${menu ? "visible" : ""}`}
            onClick={() => setMenu(false)}
          />
          <aside className={`sidebar ${menu ? "open" : ""}`}>
            <button
              className="brand"
              onClick={() => go("home")}
              aria-label="İzlek, başlangıç"
            >
              <Logo />
              <span>
                izlek<span className="brand-dot">.</span>
              </span>
            </button>
            <p className="brand-caption">OKUMANIN ÖTESİNE</p>
            <button
              className="close-menu icon-button"
              onClick={() => setMenu(false)}
              aria-label="Menüyü kapat"
            >
              <X size={20} />
            </button>
            <div className="nav-group-label">SENİN ALANIN</div>
            <nav aria-label="Ana menü">
              {nav.map((n) => (
                <button
                  key={n.id}
                  className={`nav-item ${route.view === n.id ? "active" : ""}`}
                  onClick={() =>
                    go(n.id, n.id === "book" ? store.state.book.id : undefined)
                  }
                >
                  <n.icon size={19} strokeWidth={1.7} />
                  <span>{n.label}</span>
                  {n.id === "course" && <small>{completed}/16</small>}
                  {n.id === "home" && route.view === "home" && (
                    <span className="nav-dot" />
                  )}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="sidebar-philosophy">
                <div className="mini-sprout">
                  <Leaf size={19} strokeWidth={1.5} />
                </div>
                <p>
                  Hız bir araç.
                  <br />
                  <strong>Anlam, asıl yol.</strong>
                </p>
              </div>
              <button
                className={`nav-item ${route.view === "settings" ? "active" : ""}`}
                onClick={() => go("settings")}
              >
                <Settings2 size={18} />
                <span>Tercihler ve veriler</span>
              </button>
              <div className="sidebar-user">
                <span className="avatar">
                  {store.state.profile.name
                    ? store.state.profile.name
                        .charAt(0)
                        .toLocaleUpperCase("tr-TR")
                    : "O"}
                </span>
                <div>
                  <strong>{store.state.profile.name || "Okuma alanın"}</strong>
                  <small>Bu cihazda, sana ait</small>
                </div>
                <span className="connection-dot" title="Yerel uygulama" />
              </div>
            </div>
          </aside>
        </>
      )}
      <main id="main" tabIndex={-1} className="main-shell">
        {!focusMode && (
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-button mobile-menu"
                aria-label="Menüyü aç"
                onClick={() => setMenu(true)}
              >
                <Menu size={20} />
              </button>
              <span>Okuma alanın</span>
              <ChevronRight size={13} />
              <strong>{current?.label || "Kişisel çalışma"}</strong>
            </div>
            <div className="topbar-right">
              <span className="today-date">
                {new Date(clock).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                })}
              </span>
              <span className="topbar-divider" />
              <button
                className="icon-button"
                aria-label={
                  store.state.prefs.theme === "light"
                    ? "Koyu temaya geç"
                    : "Açık temaya geç"
                }
                onClick={() =>
                  store.update((s) => ({
                    ...s,
                    prefs: {
                      ...s.prefs,
                      theme: s.prefs.theme === "light" ? "dark" : "light",
                    },
                  }))
                }
              >
                {store.state.prefs.theme === "light" ? (
                  <Moon size={18} />
                ) : (
                  <Sun size={18} />
                )}
              </button>
              <span className="avatar small">
                {store.state.profile.name
                  ? store.state.profile.name
                      .charAt(0)
                      .toLocaleUpperCase("tr-TR")
                  : "O"}
              </span>
            </div>
          </header>
        )}
        {store.error && (
          <div className="storage-banner" role="alert">
            <p>{store.error}</p>
            {store.conflict && (
              <button
                className="button small"
                onClick={() => {
                  store.sync();
                  store.retryPending();
                }}
              >
                Yeni kaydı al
              </button>
            )}
            <button className="text-button" onClick={() => go("settings")}>
              Veri yönetimi
            </button>
          </div>
        )}
        <div
          className={`page-content ${route.view === "book" ? "book-content" : ""} ${focusMode ? "focus-content" : ""}`}
        >
          {route.view === "home" ? (
            <Home store={store} go={go} />
          ) : (
            <Suspense
              fallback={
                <div className="loading-state">
                  <Logo />
                  <p>Okuma masan hazırlanıyor…</p>
                </div>
              }
            >
              <Panels route={route} store={store} go={go} />
            </Suspense>
          )}
        </div>
        {!focusMode && (
          <footer className="page-footer">
            <span>
              izlek. <span>Biraz daha dikkat, biraz daha anlam.</span>
            </span>
            <span>İçerikler özgün · Verilerin bu cihazda</span>
          </footer>
        )}
      </main>
    </div>
  );
}
function Logo() {
  return (
    <svg
      width="34"
      height="35"
      viewBox="0 0 34 35"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 6v22M12 10v18M19 6v22M26 10v18"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M5 29c7-5 15-5 22 0"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="26" cy="4" r="2" fill="currentColor" />
    </svg>
  );
}
function BookArt() {
  return (
    <svg
      viewBox="0 0 530 355"
      className="hero-book-art"
      role="img"
      aria-label="Birbirine bağlanan satırları ve ortasında yeşeren bir yaprağı olan açık kitap"
    >
      <defs>
        <pattern
          id="paperLines"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 6L6 0"
            stroke="currentColor"
            opacity=".025"
            strokeWidth=".5"
          />
        </pattern>
      </defs>
      <ellipse
        cx="276"
        cy="293"
        rx="192"
        ry="20"
        fill="currentColor"
        opacity=".04"
      />
      <path
        d="M62 98 Q160 70 263 128 Q365 70 465 98 L465 275 Q357 249 263 305 Q166 249 62 275Z"
        fill="var(--hero-paper-back)"
        stroke="var(--art-line)"
        strokeWidth="1.4"
      />
      <path
        d="M62 98L52 88 Q150 57 260 118 Q368 58 475 88L475 264 Q362 238 263 293 Q153 238 52 264Z"
        fill="var(--hero-paper)"
        stroke="var(--art-line)"
        strokeWidth="1.3"
      />
      <path
        d="M52 88Q150 56 263 116L263 293Q160 233 52 264Z"
        fill="url(#paperLines)"
      />
      <path d="M263 116V293" stroke="var(--art-line)" strokeWidth="1.2" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <g key={i} opacity={i === 2 ? 0.95 : 0.26}>
          <path
            d={`M82 ${116 + i * 18} Q162 ${99 + i * 18} 229 ${136 + i * 18}`}
            stroke={i === 2 ? "var(--accent)" : "var(--art-line)"}
            strokeWidth={i === 2 ? 7 : 2}
            strokeLinecap="round"
          />
          <path
            d={`M294 ${136 + i * 18} Q366 ${100 + i * 18} 444 ${116 + i * 18}`}
            stroke={i === 2 ? "var(--accent)" : "var(--art-line)"}
            strokeWidth={i === 2 ? 7 : 2}
            strokeLinecap="round"
          />
        </g>
      ))}
      <path
        d="M263 210C274 173 276 132 254 86"
        stroke="var(--art-green)"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M267 151C303 151 310 127 309 110C280 114 265 125 267 151Z"
        fill="var(--art-green)"
      />
      <path
        d="M265 128C236 129 221 109 225 91C248 94 264 106 265 128Z"
        fill="var(--art-green)"
        opacity=".75"
      />
      <path
        d="M253 86C235 81 234 64 242 53C258 66 260 76 253 86Z"
        fill="var(--art-green)"
      />
      <path d="M262 286L280 277V313L271 306L262 318Z" fill="var(--accent)" />
      <circle cx="435" cy="59" r="4" fill="var(--accent)" opacity=".4" />
      <path d="M108 53V65M102 59H114" stroke="var(--art-line)" opacity=".4" />
      <path
        d="M481 176V186M476 181H486"
        stroke="var(--art-line)"
        opacity=".3"
      />
    </svg>
  );
}
function openRecommendation(r: Recommendation, go: Navigate) {
  if (r.assessment) go("assessment", r.assessment);
  else if (r.lessonId) go("book", r.lessonId);
  else if (r.recallId) go("recall", r.recallId);
  else go("recommended", r.readingId, { mode: r.mode });
}
function Home({ store, go }: { store: Store; go: Navigate }) {
  const [now] = useState(() => Date.now());
  const s = store.state;
  const rec = recommend(s);
  const first = !s.profile.onboarded;
  const due = s.recalls.filter((r) => !r.done && r.due <= now);
  const firstDue = due[0];
  const natural = s.results.filter(
    (r) => r.mode === "natural" && r.complete && r.score !== null,
  );
  const last = natural.at(-1);
  const days = new Set(
    s.results
      .filter((r) => now - r.date < 7 * 86400000)
      .map((r) => new Date(r.date).toLocaleDateString("tr-TR")),
  ).size;
  const title = first
    ? "Bir sayfayla başlayalım."
    : s.profile.name
      ? `Yeniden merhaba, ${s.profile.name}.`
      : "Kaldığın yerden, kendi ritminde.";
  return (
    <>
      <div className="home-greeting">
        <div>
          <span className="eyebrow">
            <span className="tiny-sun">✳</span>{" "}
            {first ? "YENİ BİR OKUMA ALIŞKANLIĞINA" : "BUGÜN, KENDİ RİTMİNDE"}
          </span>
          <h1>{title}</h1>
          <p>
            {first
              ? "Daha amaçlı oku. Daha iyi anla. Okudukların seninle kalsın."
              : "Küçük bir çalışma, yeni bir bağlantı. Bugün için sana bir sonraki adım var."}
          </p>
        </div>
        <button className="daily-chip" onClick={() => go("settings")}>
          <Clock3 size={16} />
          <span>
            Günlük alanın <strong>{s.profile.daily} dk</strong>
          </span>
        </button>
      </div>
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="hero-pill">İZLEK YAKLAŞIMI</span> HIZDAN DAHA
            FAZLASI
          </span>
          <h2>
            Satırları geçme.
            <br />
            <em>Anlamın izini sür.</em>
          </h2>
          <p>
            İyi okumak her zaman daha hızlı okumak değildir. Ne aradığını
            bilmek, bağlantıları görmek ve fikri yanında götürmektir.
          </p>
          <button
            className="button primary"
            onClick={() =>
              first ? go("onboarding") : openRecommendation(rec, go)
            }
          >
            {first ? "Kendi yolumu çizeyim" : "Bugünkü adıma başla"}{" "}
            <ArrowRight size={17} />
          </button>
          <div className="hero-footnote">
            <span className="tiny-check">
              <Check size={12} />
            </span>
            {first
              ? "Sana uygun bir başlangıç · Hız baskısı yok"
              : "Kişisel öneri · Anlamayı koruyan pratik"}
          </div>
        </div>
        <div className="hero-illustration">
          <div className="art-note art-note-top">
            bir amaçla başla <span>↘</span>
          </div>
          <BookArt />
          <div className="art-note art-note-bottom">
            <span>↖</span> bir fikirle ayrıl
          </div>
        </div>
        <div className="hero-bottom">
          <span>
            01 <strong>Amaçlı oku</strong>
          </span>
          <span>
            02 <strong>Bağ kur</strong>
          </span>
          <span>
            03 <strong>Hatırla</strong>
          </span>
        </div>
      </section>
      <div className="home-middle">
        <section className="today-plan">
          <div className="section-heading">
            <div>
              <span className="eyebrow">BUGÜNKÜ KÜÇÜK ADIM</span>
              <h2>{first ? "Önce seni tanıyalım." : rec.title}</h2>
            </div>
            <span className="round-icon">
              <Route size={20} />
            </span>
          </div>
          <p>
            {first
              ? "Okuma amacın ve rahatlığınla başla. Sonra bir metinde kendi okuma biçimini tanı."
              : rec.reason}
          </p>
          <div className="plan-steps">
            {(first
              ? [
                  ["01", "Okuma profilin", "Amacın, süren ve rahatlığın"],
                  ["02", "İlk doğal okuman", "Hız ve anlamaya birlikte bakış"],
                  [
                    "03",
                    "İlk gerçek becerin",
                    "Bir notta amacı ve koşulu ayır",
                  ],
                ]
              : s.profile.daily === 5
                ? [
                    [
                      "01",
                      "Tek bir anlamlı adım",
                      rec.lessonId
                        ? "Anlatımı ve anlam kararını çalış"
                        : "Önerilen kısa çalışmaya odaklan",
                    ],
                    [
                      "02",
                      "Bir sonraki başlangıç",
                      "Kaldığın yer korunur; görev borcu yok",
                    ],
                  ]
                : s.profile.daily === 10
                  ? [
                      [
                        "01",
                        "Öğren ve karar ver",
                        "Anlatımdan kısa bir anlam seçimine",
                      ],
                      [
                        "02",
                        "Yeni metinde uygula",
                        "Pratik ve içerik temelli geri bildirim",
                      ],
                    ]
                  : [
                      [
                        "01",
                        "Öğren ve uygula",
                        "Önerilen beceriyi yeni metne taşı",
                      ],
                      [
                        "02",
                        "Biraz daha derinleş",
                        "Uzun metinde bölüm ilişkilerini koru",
                      ],
                      [
                        "03",
                        "Fikri geri çağır",
                        "Metin kapalıyken kısa bir özet yaz",
                      ],
                    ]
            ).map(([n, t, d]) => (
              <div className="plan-step" key={n}>
                <span>{n}</span>
                <div>
                  <strong>{t}</strong>
                  <small>{d}</small>
                </div>
              </div>
            ))}
          </div>
          <button
            className="text-button accent"
            onClick={() =>
              first ? go("onboarding") : openRecommendation(rec, go)
            }
          >
            {first ? "Başlangıcımı oluştur" : "Önerilen çalışmayı aç"}{" "}
            <ArrowRight size={16} />
          </button>
          {!first && s.profile.daily === 20 && (
            <button
              className="text-button"
              onClick={() => go("studio", "long")}
            >
              Bugüne uzun okuma ekle <ArrowRight size={15} />
            </button>
          )}
        </section>
        <section className="progress-peek">
          <div className="section-heading">
            <div>
              <span className="eyebrow">GELİŞİM BİR SAYIDAN FAZLASI</span>
              <h2>
                {last ? "Okumandan kalan izler." : "İlk izin burada belirecek."}
              </h2>
            </div>
            <ChartNoAxesCombined size={21} />
          </div>
          {last ? (
            <>
              <div className="peek-numbers">
                <div>
                  <strong>{last.wpm ?? "—"}</strong>
                  <span>Son doğal hız · k/dk</span>
                </div>
                <div>
                  <strong>%{last.score}</strong>
                  <span>Bu metinde anlama</span>
                </div>
              </div>
              <p className="subtle">
                {last.title} · Düzey {last.level} ·{" "}
                {last.repeated ? "Tekrar" : "Yeni"} ·{" "}
                {last.interrupted ? "Kesintili" : "Kesinti yok"}
              </p>
              <div className="week-note">
                <Leaf size={19} />
                <span>
                  Son 7 günde <strong>{days} farklı gün</strong> okuma çalıştın.
                  Kaçan günlerin borcu yok.
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="empty-progress-art" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <div className="empty-seed">
                  <Leaf size={24} />
                </div>
              </div>
              <p>
                Henüz ölçüm yok; tahmin de yok.
                <br />
                İlk okumanla hızını ve anlamanı ayrı ayrı göreceksin.
              </p>
            </>
          )}
          <button className="text-button" onClick={() => go("progress")}>
            Gelişim günlüğün <ArrowUpRight size={16} />
          </button>
        </section>
      </div>
      {firstDue && (
        <button
          className="recall-callout"
          onClick={() => go("recall", firstDue.id)}
        >
          <span className="round-icon">
            <Brain size={23} />
          </span>
          <div>
            <span className="eyebrow">BİR GÜN GEÇTİ</span>
            <h3>Dünden kalan bir fikri geri çağıralım.</h3>
            <p>
              {due.length} hatırlama dönüşü hazır. Metni açmadan kendi
              cümlelerinle başla.
            </p>
          </div>
          <ArrowRight size={21} />
        </button>
      )}
      <section className="path-preview">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BAŞLANGIÇTAN BAĞIMSIZ OKUMAYA</span>
            <h2>Her adımda, biraz daha bilinçli.</h2>
          </div>
          <button className="text-button" onClick={() => go("course")}>
            Öğrenme yolunu gör <ArrowRight size={16} />
          </button>
        </div>
        <div className="path-chapters">
          {[
            ["I", "Yönünü bul", "Amaç, dikkat ve ilk anlam grupları"],
            ["II", "Akışı kur", "Türkçe, ritim ve anlam ilişkileri"],
            ["III", "Anlamı derinleştir", "Strateji, takip ve hatırlama"],
            ["IV", "Kendi yolunu çiz", "Gerçek metinler ve bağımsızlık"],
          ].map(([n, t, d], i) => {
            const count = Array.from(
              { length: 4 },
              (_, j) => `l${String(i * 4 + j + 1).padStart(2, "0")}`,
            ).filter((id) => lessonDone(s, id)).length;
            return (
              <button
                key={n}
                className={`path-chapter ${i === 0 ? "current" : ""}`}
                onClick={() =>
                  go("book", `l${String(i * 4 + 1).padStart(2, "0")}`)
                }
              >
                <div className="path-node">
                  {count === 4 ? <Check size={18} /> : n}
                </div>
                <h3>{t}</h3>
                <p>{d}</p>
                <span>
                  {count} / 4 ders <ArrowUpRight size={13} />
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="explore-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SANA AİT BİR OKUMA ALANI</span>
            <h2>Bugün başka bir kapı aç.</h2>
          </div>
        </div>
        <div className="explore-grid">
          <button
            className="explore-card book-explore"
            onClick={() => go("book", s.book.id)}
          >
            <div className="little-book" aria-hidden="true">
              <span>
                İZLEK
                <br />
                <em>
                  Bir metnin
                  <br />
                  içinden
                  <br />
                  geçmek.
                </em>
                <small>OKUMA KİTABI</small>
              </span>
            </div>
            <div>
              <span className="eyebrow">DİJİTAL KİTABIN</span>
              <h3>
                Öğrenmek için
                <br />
                bir sayfa aç.
              </h3>
              <p>
                16 derslik özgün anlatım,
                <br />
                çözülmüş örnekler ve kararlar.
              </p>
              <span className="explore-link">
                {s.readLessons.length ? "Kaldığım yerden" : "Kitabı keşfet"}{" "}
                <ArrowUpRight size={16} />
              </span>
            </div>
          </button>
          <button
            className="explore-card studio-explore"
            onClick={() => go("studio")}
          >
            <span className="explore-icon">
              <Layers3 size={31} strokeWidth={1.4} />
            </span>
            <span className="eyebrow">ANTRENMAN STÜDYOSU</span>
            <h3>
              Bir beceriye
              <br />
              alan aç.
            </h3>
            <p>
              Doğal okuma, anlam grupları,
              <br />
              tarama ve daha fazlası.
            </p>
            <span className="explore-link">
              Stüdyoya gir <ArrowUpRight size={16} />
            </span>
          </button>
          <button
            className="explore-card games-explore"
            onClick={() => go("games")}
          >
            <span className="explore-icon">
              <Shapes size={31} strokeWidth={1.4} />
            </span>
            <span className="eyebrow">ANLAM OYUNLARI</span>
            <h3>
              Düşünerek
              <br />
              biraz oyna.
            </h3>
            <p>
              Hikâyeleri birleştir,
              <br />
              kanıtları bul, ilişkileri hatırla.
            </p>
            <span className="explore-link">
              Oyunları keşfet <ArrowUpRight size={16} />
            </span>
          </button>
        </div>
      </section>
      <div className="home-quote">
        <span>“</span>
        <p>
          İyi bir okuma, son satırda bitmez.
          <br />
          <em>Sende kalan düşüncede devam eder.</em>
        </p>
        <span className="quote-leaf">
          <Leaf size={24} />
        </span>
      </div>
    </>
  );
}
