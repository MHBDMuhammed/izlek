import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Search,
  SlidersHorizontal,
  Upload,
  Download,
  Trash2,
  Clock3,
  Check,
  Plus,
  Eye,
  Link,
  Brain,
  FileText,
  Leaf,
  Waypoints,
  MoveHorizontal,
  ChevronsRight,
  Sun,
  Moon,
} from "lucide-react";
import type { Navigate, RouteState } from "../App";
import {
  type Store,
  type Goal,
  fresh,
  validState,
  comparable,
  lessonDone,
  recommend,
} from "../core";
import { readings, byId } from "../content/readings";
import type { Reading, Mode } from "../content/types";
import { lessons } from "../content/lessons";
import { wordCount, validateText, normalize, minutesLabel } from "../text";
import Reader, { modeNames } from "./Reader";
import Games from "./Games";
import Book, { Course } from "./Book";
export default function Panels({
  route,
  store,
  go,
}: {
  route: RouteState;
  store: Store;
  go: Navigate;
}) {
  const { view, id } = route;
  const [custom, setCustom] = useState<Reading | null>(null);
  switch (view) {
    case "recommended":
      return <RecommendedReader store={store} go={go} />;
    case "course":
      return <Course store={store} go={go} />;
    case "book":
      return (
        <Book key={id || store.state.book.id} store={store} go={go} id={id} />
      );
    case "studio":
      return <Studio store={store} go={go} selected={id} />;
    case "games":
      return (
        <Games
          store={store}
          initialGame={id}
          onLesson={(id) => go("book", id)}
        />
      );
    case "library":
      return <Library store={store} go={go} />;
    case "progress":
      return <Progress store={store} go={go} />;
    case "settings":
      return <Settings store={store} go={go} />;
    case "onboarding":
      return <Onboarding store={store} go={go} />;
    case "assessment":
      return (
        <Assessment
          phase={(id as "baseline" | "mid" | "final") || "baseline"}
          store={store}
          go={go}
        />
      );
    case "recall":
      return <Recall key={id} id={id} store={store} go={go} />;
    case "custom":
      return custom ? (
        <Reader
          key={custom.id}
          reading={custom}
          initialMode={route.mode || "natural"}
          store={store}
          onExit={() => setCustom(null)}
          onLesson={(id) => go("book", id)}
          onTransfer={() => go("studio", "natural")}
        />
      ) : (
        <Custom
          store={store}
          start={(r, m) => {
            setCustom(r);
            go("custom", undefined, { mode: m });
          }}
        />
      );
    case "reader": {
      const r = byId(id || "r07");
      if (!r)
        return (
          <div className="empty-state">
            <h2>Bu metin bulunamadı.</h2>
            <button className="button" onClick={() => go("library")}>
              Kütüphaneye dön
            </button>
          </div>
        );
      return (
        <Reader
          key={`${r.id}-${route.mode}-${route.assessment}-${route.lessonId}`}
          reading={r}
          initialMode={route.mode || "natural"}
          store={store}
          assessment={route.assessment}
          lessonId={route.lessonId}
          initialTempo={recommend(store.state).tempo}
          onExit={() =>
            route.lessonId
              ? go("book", route.lessonId)
              : route.assessment
                ? go("progress")
                : go("studio")
          }
          onLesson={(id) => go("book", id)}
          onTransfer={() => {
            const next =
              readings.find(
                (x) =>
                  x.role === "practice" &&
                  !store.state.exposure[x.id] &&
                  x.level === r.level &&
                  x.id !== r.id,
              ) ??
              byId("r08") ??
              readings[0];
            if (next) go("reader", next.id, { mode: "natural" });
          }}
        />
      );
    }
    default:
      return <Library store={store} go={go} />;
  }
}
const tools = [
  {
    mode: "natural",
    title: "Kendi ritminde oku",
    label: "TEMEL ÇALIŞMA",
    desc: "Normal paragraflar. Kontrol sende; hız ve anlama ayrı izlenir.",
    icon: BookOpen,
  },
  {
    mode: "guide",
    title: "Bir ritim yakala",
    label: "REHBERLİ TEMPO",
    desc: "İsteğe bağlı cümle vurgusuyla akışı çalış, sonra yardımı kaldır.",
    icon: Waypoints,
  },
  {
    mode: "groups",
    title: "Anlamı birlikte gör",
    label: "ANLAM GRUPLARI",
    desc: "Editoryal gruplarla sözcükler arasındaki bağı fark et.",
    icon: Link,
  },
  {
    mode: "serial",
    title: "Tek noktada dene",
    label: "SERİ SUNUM",
    desc: "Tek sözcük veya küçük sunum gruplarıyla kontrollü bir deneyim.",
    icon: ChevronsRight,
  },
  {
    mode: "skim",
    title: "Büyük resmi yakala",
    label: "GÖZ GEZDİRME",
    desc: "Yapıdan bir beklenti kur, metnin bütünüyle karşılaştır.",
    icon: Eye,
  },
  {
    mode: "scan",
    title: "Aradığını bul",
    label: "BİLGİ TARAMA",
    desc: "Hedef bilgiye ulaş; doğru paragrafı ve bağlamı seç.",
    icon: Search,
  },
  {
    mode: "meaning",
    title: "Bağlantıyı çöz",
    label: "ANLAMA ATÖLYESİ",
    desc: "Ana düşünce, sav, kanıt ve çıkarımı açık metinle incele.",
    icon: MoveHorizontal,
  },
  {
    mode: "recall",
    title: "Fikri yanında götür",
    label: "HATIRLAMA VE ÖZET",
    desc: "Metni kapat, anlat, temel fikirlerle kendin karşılaştır.",
    icon: Brain,
  },
  {
    mode: "long",
    title: "Biraz daha derine",
    label: "UZUN OKUMA",
    desc: "Tek bir uzun metnin içinde yönünü ve dikkatini koru.",
    icon: Leaf,
  },
] as const;
function Studio({
  store,
  go,
  selected,
}: {
  store: Store;
  go: Navigate;
  selected?: string;
}) {
  const [mode, setMode] = useState<Mode>(
    (tools.some((t) => t.mode === selected) ? selected : "natural") as Mode,
  );
  const [level, setLevel] = useState("all");
  const list = readings.filter(
    (r) =>
      r.role === "practice" &&
      r.modes.includes(mode) &&
      (level === "all" || r.level === +level),
  );
  const [selectedId, setSelectedId] = useState("");
  const chosen =
    list.find((r) => r.id === selectedId) ||
    list.find((r) => !store.state.exposure[r.id]) ||
    list[0];
  return (
    <>
      <div className="page-heading split-heading">
        <div>
          <span className="eyebrow">ANTRENMAN STÜDYOSU</span>
          <h1>
            Bir beceri seç.
            <br />
            <em>Kendi ritmini bul.</em>
          </h1>
          <p>Bugün neye ihtiyacın varsa, ona yer aç.</p>
        </div>
        <button className="button" onClick={() => go("custom")}>
          <Plus size={17} /> Kendi metnini getir
        </button>
      </div>
      <div className="studio-layout">
        <div className="tool-list" role="group" aria-label="Çalışma biçimi">
          {tools.map((t) => (
            <button
              className={`tool-choice ${mode === t.mode ? "selected" : ""}`}
              key={t.mode}
              onClick={() => {
                setMode(t.mode);
                setSelectedId("");
              }}
            >
              <span className="tool-icon">
                <t.icon size={23} strokeWidth={1.6} />
              </span>
              <div>
                <span className="eyebrow">{t.label}</span>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
              <ChevronIcon active={mode === t.mode} />
            </button>
          ))}
        </div>
        <aside className="studio-preview">
          <div className={`studio-visual visual-${mode}`} aria-hidden="true">
            <span className="visual-word">
              {mode === "serial"
                ? "kelime"
                : mode === "scan"
                  ? "bir bilgi"
                  : mode === "groups"
                    ? "birlikte / anlam"
                    : mode === "recall"
                      ? "aklında kalan"
                      : "bir metnin"}
            </span>
            <span className="visual-word italic">
              {mode === "long"
                ? "içinde kal."
                : mode === "meaning"
                  ? "bağını kur."
                  : "izini sür."}
            </span>
            <div className="visual-lines">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="studio-select">
            <span className="eyebrow">{modeNames[mode]}</span>
            <h2>Çalışma metnin</h2>
            <label className="field">
              Metin düzeyi
              <select
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  setSelectedId("");
                }}
              >
                <option value="all">Bütün düzeyler</option>
                <option value="1">1 · Açık ilişkiler</option>
                <option value="2">2 · Birden çok bağlantı</option>
                <option value="3">3 · Yoğun ve örtük ilişkiler</option>
              </select>
            </label>
            {chosen ? (
              <>
                <label className="field">
                  Metin
                  <select
                    value={chosen.id}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {list.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} · {r.words} kelime
                        {store.state.exposure[r.id] ? " · görüldü" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <p>{chosen.complexity}</p>
                <div className="tag-row">
                  <span className="tag">{chosen.genre}</span>
                  <span className="tag">Düzey {chosen.level}</span>
                  <span className="tag">{chosen.words} kelime</span>
                </div>
                <button
                  className="button primary full"
                  onClick={() => go("reader", chosen.id, { mode })}
                >
                  Masayı hazırla <ArrowRight size={17} />
                </button>
              </>
            ) : (
              <p>
                Bu düzeyde bu araç için uygun hazır metin yok. Düzey filtresini
                genişlet veya kendi metninle çalış.
              </p>
            )}
            <p className="subtle">
              Süre ve sunum ayarlarını başlamadan önce seçersin. Doğal okuma,
              temel gelişim gözlemidir.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
function ChevronIcon({ active }: { active: boolean }) {
  return <ArrowRight size={17} className={active ? "accent" : ""} />;
}
function Library({ store, go }: { store: Store; go: Navigate }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("all");
  const [level, setLevel] = useState("all");
  const [length, setLength] = useState("all");
  const [exposure, setExposure] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const list = readings.filter(
    (r) =>
      r.role === "practice" &&
      normalize(`${r.title} ${r.genre} ${r.skills.join(" ")}`).includes(
        normalize(query),
      ) &&
      (genre === "all" || r.genre === genre) &&
      (level === "all" || r.level === +level) &&
      (length === "all" ||
        (length === "long" ? r.words >= 700 : r.words < 700)) &&
      (exposure === "all" ||
        (exposure === "new"
          ? !store.state.exposure[r.id]
          : !!store.state.exposure[r.id])),
  );
  return (
    <>
      <div className="page-heading split-heading">
        <div>
          <span className="eyebrow">TÜRKÇE OKUMA KÜTÜPHANESİ</span>
          <h1>
            Her metin,
            <br />
            <em>başka bir pencere.</em>
          </h1>
          <p>
            Özgün anlatılar, gündelik kararlar ve düşünce yazıları. Altı uzun
            okuma, derinleşmek için.
          </p>
        </div>
        <button className="button" onClick={() => go("custom")}>
          <Plus size={17} /> Kendi metnim
        </button>
      </div>
      <div className="library-filters">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Metin ara"
            placeholder="Başlık, tür veya beceri ara…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Metin türü"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="all">Bütün türler</option>
          {[
            ...new Set(
              readings.filter((r) => r.role === "practice").map((r) => r.genre),
            ),
          ].map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <select
          aria-label="Metin düzeyi"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="all">Bütün düzeyler</option>
          {[1, 2, 3].map((x) => (
            <option key={x} value={x}>
              Düzey {x}
            </option>
          ))}
        </select>
        <select
          aria-label="Metin uzunluğu"
          value={length}
          onChange={(e) => setLength(e.target.value)}
        >
          <option value="all">Bütün uzunluklar</option>
          <option value="short">Kısa ve orta</option>
          <option value="long">Uzun · 700+ kelime</option>
        </select>
        <select
          aria-label="Maruziyet filtresi"
          value={exposure}
          onChange={(e) => setExposure(e.target.value)}
        >
          <option value="all">Bütün pratikler</option>
          <option value="new">Henüz açılmadı</option>
          <option value="seen">Daha önce görüldü</option>
        </select>
      </div>
      <div className="section-line">
        <span>{list.length} pratik metni</span>
        <span>6 değerlendirme metni kendi akışında ayrı tutulur.</span>
      </div>
      <div className="library-grid">
        {list.map((r) => (
          <article
            className={`text-card ${r.words >= 700 ? "long-card" : ""}`}
            key={r.id}
          >
            <div className="text-card-top">
              <span className="eyebrow">{r.genre}</span>
              <span>
                {r.words >= 700 ? (
                  <BookOpen size={18} />
                ) : (
                  <FileText size={17} />
                )}
              </span>
            </div>
            <h2>{r.title}</h2>
            <p>{r.complexity}</p>
            <div className="tag-row">
              <span className="tag">Düzey {r.level}</span>
              <span className="tag">{r.words} kelime</span>
              {store.state.exposure[r.id] ? (
                <span className="tag">
                  {store.state.exposure[r.id]} kez açıldı
                </span>
              ) : (
                <span className="tag new-tag">Yeni</span>
              )}
            </div>
            <div className="text-card-actions">
              <button
                className="text-button"
                onClick={() =>
                  go("reader", r.id, {
                    mode: r.words >= 700 ? "long" : "natural",
                  })
                }
              >
                Okumaya geç <ArrowRight size={16} />
              </button>
              <button
                className="icon-button"
                aria-label={`${r.title} çalışma seçenekleri`}
                aria-expanded={expanded === r.id}
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>
            {expanded === r.id && (
              <div className="mode-picker">
                {r.modes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => go("reader", r.id, { mode })}
                  >
                    {modeNames[mode]} <ArrowRight size={13} />
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
      {!list.length && (
        <div className="empty-state">
          <Search />
          <h2>Bu filtrelerle metin bulunamadı.</h2>
          <p>Bir filtreyi kaldırarak kütüphaneyi genişlet.</p>
          <button
            className="button"
            onClick={() => {
              setQuery("");
              setGenre("all");
              setLevel("all");
              setLength("all");
              setExposure("all");
            }}
          >
            Filtreleri temizle
          </button>
        </div>
      )}
    </>
  );
}
function Assessment({
  phase,
  store,
  go,
}: {
  phase: "baseline" | "mid" | "final";
  store: Store;
  go: Navigate;
}) {
  const validPhase = ["baseline", "mid", "final"].includes(phase)
    ? phase
    : "baseline";
  const options = readings.filter((r) => r.role === validPhase);
  const freshText = options.find((r) => !store.state.exposure[r.id]);
  const previous = store.state.results.filter(
    (r) => r.assessment === validPhase,
  );
  const done = lessons.filter((l) => lessonDone(store.state, l.id)).length;
  const suggested =
    validPhase === "baseline" ||
    (validPhase === "mid" ? done >= 8 : done >= 16);
  return (
    <div className="assessment-page">
      <span className="eyebrow">
        YENİ METİN · DOĞAL OKUMA · KAPALI METİN SORULARI
      </span>
      <h1>
        {
          {
            baseline: "Başladığın yeri tanı.",
            mid: "Yolun ortasında dur.",
            final: "Öğrendiklerini yanında götür.",
          }[validPhase]
        }
      </h1>
      <p className="lead">
        Bir hız yarışı değil. Ne kadar sürede okuduğunu ve hangi anlam
        ilişkilerini kurduğunu birlikte gözlemleyeceğiz.
      </p>
      <div className="assessment-steps">
        <div>
          <span>01</span>
          <h3>Rahatlığını ayarla</h3>
          <p>
            Hazırlık süresi ölçülmez. Yeni metin açıldığında aktif süre başlar.
          </p>
        </div>
        <div>
          <span>02</span>
          <h3>Kendi hızında oku</h3>
          <p>
            Rehber kullanmadan, normal paragraflarla ilerle. Bitirdiğini sen
            bildir.
          </p>
        </div>
        <div>
          <span>03</span>
          <h3>Bağlantıları hatırla</h3>
          <p>
            Beş farklı anlam sorusunu metin kapalıyken cevapla. Gerekçeler
            sonunda açılır.
          </p>
        </div>
      </div>
      {!suggested && (
        <p className="notice">
          Bu durak {validPhase === "mid" ? "ilk sekiz" : "on altı"} dersin
          ardından önerilir. İstersen şimdi erişebilirsin; erken değerlendirme
          kurs tamamlama sayılmaz.
        </p>
      )}
      {freshText ? (
        <div className="next-strip">
          <div>
            <span className="eyebrow">HENÜZ AÇILMAMIŞ METİN</span>
            <h2>{freshText.title}</h2>
            <p>
              Düzey {freshText.level} · {freshText.words} kelime · 5 anlam
              sorusu
            </p>
          </div>
          <button
            className="button primary"
            onClick={() =>
              go("reader", freshText.id, {
                mode: "natural",
                assessment: validPhase,
              })
            }
          >
            Hazırlığa geç <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <BookOpen />
          <h2>Bu duraktaki yeni metinleri açtın.</h2>
          <p>
            Tekrar okumak mümkün; ancak eski metin yeni değerlendirme gibi
            sunulmaz. Yeni gözlemler için kütüphanedeki farklı pratikleri
            kullan.
          </p>
          <div className="actions">
            {options.map((r) => (
              <button
                className="button"
                key={r.id}
                onClick={() =>
                  go("reader", r.id, {
                    mode: "natural",
                    assessment: validPhase,
                  })
                }
              >
                {r.title} · tekrar
              </button>
            ))}
            <button className="text-button" onClick={() => go("library")}>
              Kütüphaneyi aç
            </button>
          </div>
        </div>
      )}
      <p className="subtle">
        Kesinti, yardım ve önceki maruziyet kayıt yanında görünür. Metinler
        benzer hedef güçlükte yazıldı; bilimsel olarak standartlaştırılmış
        eşdeğer testler değildir.
      </p>
      {previous.length > 0 && (
        <>
          <h2>Bu duraktaki gözlemlerin</h2>
          <ResultTable results={previous} />
        </>
      )}
    </div>
  );
}
function Custom({
  store,
  start,
}: {
  store: Store;
  start: (r: Reading, m: Mode) => void;
}) {
  const [title, setTitle] = useState("Kendi okuma metnim");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<Mode>("natural");
  const [save, setSave] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  async function file(f: File | undefined) {
    if (!f) return;
    try {
      if (!f.name.toLowerCase().endsWith(".txt"))
        throw Error("UTF-8 kodlamalı bir .txt dosyası seç.");
      if (f.size > 400000)
        throw Error("Dosya çok büyük. 400 KB altında bir metin bölümü seç.");
      const t = new TextDecoder("utf-8", { fatal: true }).decode(
        await f.arrayBuffer(),
      );
      setBody(validateText(t));
      setTitle(f.name.replace(/\.txt$/i, ""));
      setSavedId(null);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dosya okunamadı.");
    }
  }
  function begin() {
    try {
      const text = validateText(body);
      const id = savedId || `custom-${crypto.randomUUID()}`;
      if (save) {
        if (text.length > 50000)
          throw Error(
            "Kalıcı metinler en fazla 50.000 karakter olabilir. Kaydetmeden daha büyük metinle çalışabilirsin.",
          );
        if (!savedId && store.state.custom.length >= 10)
          throw Error(
            "En fazla 10 metin saklanabilir. Birini sil veya kaydetmeden çalış.",
          );
        if (
          !store.update((s) => ({
            ...s,
            custom: [
              ...s.custom.filter((c) => c.id !== id),
              {
                id,
                title: title.trim().slice(0, 100) || "Kendi metnim",
                body: text,
              },
            ],
          }))
        )
          return;
      }
      start(
        {
          id,
          version: 1,
          title: title.trim().slice(0, 100) || "Kendi metnim",
          genre: "Kendi metnin",
          level: 0,
          complexity:
            "Bu metnin güçlük düzeyi belirlenmedi. Anlama sorusu bulunmadığından karşılaştırmalara katılmaz.",
          role: "practice",
          paragraphs: text.split(/\n\s*\n/).filter(Boolean),
          questions: [],
          summary: "",
          points: [],
          words: wordCount(text),
          skills: [],
          modes: ["natural", "guide", "groups", "serial", "recall"],
        },
        mode,
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">KENDİ METNİNLE ÇALIŞ</span>
        <h1>
          Okumak istediğin şeyi
          <br />
          <em>masaya getir.</em>
        </h1>
        <p>
          Düz metin olarak yapıştır veya yerel bir .txt dosyası aç. İçerik
          cihazından gönderilmez.
        </p>
      </div>
      <div className="custom-layout">
        <div>
          <label className="field">
            Metin başlığı
            <input
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="field">
            Türkçe metnin
            <textarea
              rows={15}
              maxLength={100000}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setSavedId(null);
              }}
              placeholder="Metnini buraya yapıştır…"
            />
          </label>
          <div className="section-line">
            <span>
              {wordCount(body)} kelime · {body.length.toLocaleString("tr-TR")} /
              100.000 karakter
            </span>
            <label className="button file-button">
              <Upload size={16} /> .txt aç
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={(e) => void file(e.target.files?.[0])}
              />
            </label>
          </div>
          <p className="notice">
            Metin HTML olarak çalıştırılmaz. Hazır sorular bulunmadığından
            otomatik anlama puanı yoktur; doğal hızın da düzeyi bilinen
            kütüphane metinleriyle karşılaştırılmaz.
          </p>
        </div>
        <aside className="paper-panel">
          <h2>Nasıl çalışacaksın?</h2>
          <label className="field">
            Sunum biçimi
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              {["natural", "guide", "groups", "serial", "recall"].map((m) => (
                <option value={m} key={m}>
                  {modeNames[m as Mode]}
                </option>
              ))}
            </select>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={save}
              onChange={(e) => setSave(e.target.checked)}
            />
            <span>Metni bu tarayıcıda sakla</span>
          </label>
          <p className="subtle">
            Seçmezsen kendi metnin sayfadan ayrıldığında kalıcı kütüphaneye
            yazılmaz. Kaydettiğin özet ve oturum bilgisi ilerleme günlüğünde
            kalır.
          </p>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <button className="button primary full" onClick={begin}>
            Çalışma alanına geç <ArrowRight size={16} />
          </button>
          <h3>Sakladığın metinler</h3>
          {store.state.custom.length ? (
            store.state.custom.map((c) => (
              <div className="saved-custom" key={c.id}>
                <button
                  className="text-button"
                  onClick={() => {
                    setBody(c.body);
                    setTitle(c.title);
                    setSavedId(c.id);
                    setSave(false);
                  }}
                >
                  {c.title}
                </button>
                <button
                  className="icon-button"
                  aria-label={`${c.title} metnini sil`}
                  onClick={() => {
                    if (
                      confirm(
                        "Bu metin yerel kütüphanenden silinecek. Oturum özetleri kalacak. Silinsin mi?",
                      )
                    )
                      store.update((s) => ({
                        ...s,
                        custom: s.custom.filter((x) => x.id !== c.id),
                      }));
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          ) : (
            <p className="subtle">Henüz saklanmış metnin yok.</p>
          )}
        </aside>
      </div>
    </>
  );
}
function Recall({
  id,
  store,
  go,
}: {
  id?: string;
  store: Store;
  go: Navigate;
}) {
  const item = store.state.recalls.find((r) => r.id === id);
  const reading = item ? byId(item.readingId) : null;
  const [draft, setDraft] = useState(item?.draft || "");
  const [reveal, setReveal] = useState(false);
  const [checks, setChecks] = useState<number[]>([]);
  const [saved, setSaved] = useState(false);
  const [now] = useState(() => Date.now());
  if (!item || !reading)
    return (
      <div className="empty-state">
        <Brain />
        <h2>Hatırlama sıran</h2>
        <p>
          Tamamlanan doğal ve uzun okumalarından bir gün sonra burada kısa bir
          geri çağırma belirir.
        </p>
        {store.state.recalls
          .filter((r) => !r.done)
          .map((r) => (
            <button
              className="list-link"
              key={r.id}
              onClick={() => go("recall", r.id)}
            >
              <span>
                {byId(r.readingId)?.title || "Metin artık bulunmuyor"}
              </span>
              <span>
                {r.due <= now
                  ? "Hazır"
                  : new Date(r.due).toLocaleString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
      </div>
    );
  if (item.due > now && !item.done)
    return (
      <div className="empty-state">
        <Clock3 />
        <h2>Biraz zaman geçsin.</h2>
        <p>
          Gecikmeli hatırlama için bu kayıt{" "}
          {new Date(item.due).toLocaleString("tr-TR")} tarihinde hazır olacak.
          Şimdi metni tekrar açmak farklı bir pratik olur.
        </p>
        <button className="button" onClick={() => go("library")}>
          Yeni metin seç
        </button>
      </div>
    );
  return (
    <div className="recall-page">
      <span className="eyebrow">GECİKMELİ GERİ ÇAĞIRMA · ÖZ DEĞERLENDİRME</span>
      <h1>
        Metin kapalı.
        <br />
        <em>Fikir sende mi?</em>
      </h1>
      <p className="lead">
        “{reading.title}” okumasındaki ana düşünceyi ve iki bağlantıyı hatırla.
        Metni açmadan kendi cümlelerini yaz.
      </p>
      {item.done || saved ? (
        <div className="model-summary">
          <Check />
          <h2>Hatırlama dönüşü tamamlandı.</h2>
          <p className="preserve">{item.draft || draft}</p>
          <p>
            İşaretlediğin temel fikir oranı: %
            {item.selfScore ??
              Math.round((checks.length / reading.points.length) * 100)}
            . Bu kendi değerlendirmen; otomatik anlama puanı değil.
          </p>
          <button className="button primary" onClick={() => go("home")}>
            Bugünkü adıma dön <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <>
          <label className="field">
            Aklında kalan
            <textarea
              rows={8}
              maxLength={5000}
              value={draft}
              disabled={reveal}
              onBlur={() =>
                store.update((s) => ({
                  ...s,
                  recalls: s.recalls.map((r) =>
                    r.id === id ? { ...r, draft } : r,
                  ),
                }))
              }
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <button
            className="button primary"
            disabled={!draft.trim() || reveal}
            onClick={() => setReveal(true)}
          >
            Şimdi fikir listesiyle karşılaştır
          </button>
          {reveal && (
            <div className="model-summary">
              <h2>İlişkileri kontrol et.</h2>
              <p>{reading.summary}</p>
              {reading.points.map((p, i) => (
                <label className="check-row" key={p}>
                  <input
                    type="checkbox"
                    checked={checks.includes(i)}
                    onChange={() =>
                      setChecks((c) =>
                        c.includes(i) ? c.filter((x) => x !== i) : [...c, i],
                      )
                    }
                  />
                  <span>Benim yanıtımda var: {p}</span>
                </label>
              ))}
              <p className="subtle">
                Aynı sözcükleri kullanman gerekmiyor. İlişkinin anlamını koruyup
                korumadığına bak.
              </p>
              <button
                className="button primary"
                onClick={() =>
                  setSaved(
                    store.update((s) => ({
                      ...s,
                      recalls: s.recalls.map((r) =>
                        r.id === id
                          ? {
                              ...r,
                              draft,
                              done: Date.now(),
                              selfScore: Math.round(
                                (checks.length / reading.points.length) * 100,
                              ),
                            }
                          : r,
                      ),
                      lastVisit: Date.now(),
                    })),
                  )
                }
              >
                Öz değerlendirmeyi kaydet
              </button>
              <details>
                <summary>Kaynak metni incele</summary>
                <div className="reading-text">
                  {reading.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </details>
            </div>
          )}
        </>
      )}
    </div>
  );
}
function Onboarding({ store, go }: { store: Store; go: Navigate }) {
  const [name, setName] = useState(store.state.profile.name);
  const [goal, setGoal] = useState<Goal>(store.state.profile.goal);
  const [daily, setDaily] = useState<5 | 10 | 20>(store.state.profile.daily);
  const [serif, setSerif] = useState(store.state.prefs.serif);
  const [font, setFont] = useState(store.state.prefs.font);
  const [theme, setTheme] = useState(store.state.prefs.theme);
  return (
    <div className="onboarding">
      <span className="eyebrow">TANIŞALIM · YAKLAŞIK BİR DAKİKA</span>
      <h1>
        Bu yol,
        <br />
        <em>senin okuman için.</em>
      </h1>
      <p className="lead">
        Bir hız hedefi seçmiyoruz. Okumaya ayırabileceğin yere ve zamana göre
        başlayacağız.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            store.update((s) => ({
              ...s,
              profile: { name: name.trim(), goal, daily, onboarded: true },
              prefs: { ...s.prefs, serif, font, theme },
            }))
          )
            go("assessment", "baseline");
        }}
      >
        <label className="field">
          Sana nasıl seslenelim? <small>İsteğe bağlı</small>
          <input
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adın"
            autoComplete="given-name"
          />
        </label>
        <fieldset className="choice-fieldset">
          <legend>Okumak senin için en çok neye kapı açsın?</legend>
          <div className="choice-grid">
            {(
              [
                "Öğrenmek",
                "Sınava hazırlanmak",
                "Mesleki okuma",
                "Keyif için okumak",
              ] as Goal[]
            ).map((g) => (
              <label
                className={`choice-tile ${goal === g ? "selected" : ""}`}
                key={g}
              >
                <input
                  type="radio"
                  name="goal"
                  checked={goal === g}
                  onChange={() => setGoal(g)}
                />
                {g}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="choice-fieldset">
          <legend>Gününe ne kadar yer açabilirsin?</legend>
          <div className="choice-grid three">
            {([5, 10, 20] as const).map((d, i) => (
              <label
                className={`choice-tile ${daily === d ? "selected" : ""}`}
                key={d}
              >
                <input
                  type="radio"
                  name="daily"
                  checked={daily === d}
                  onChange={() => setDaily(d)}
                />
                <strong>{d} dakika</strong>
                <small>
                  {
                    [
                      "Kısa bir temas",
                      "Dengeli bir oturum",
                      "Derin bir çalışma",
                    ][i]
                  }
                </small>
              </label>
            ))}
          </div>
          <small>
            Uzun okumalar birkaç oturuma yayılabilir. Kaçırılan günlerden görev
            borcu oluşmaz.
          </small>
        </fieldset>
        <div className="preference-grid">
          <label className="field">
            Okuma yazısı
            <select
              value={serif ? "serif" : "sans"}
              onChange={(e) => setSerif(e.target.value === "serif")}
            >
              <option value="serif">Kitap · serif</option>
              <option value="sans">Yalın · sans serif</option>
            </select>
          </label>
          <label className="field">
            Görünüm
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as "light" | "dark")}
            >
              <option value="light">Açık · kâğıt</option>
              <option value="dark">Koyu · gece</option>
            </select>
          </label>
          <label className="field">
            Yazı boyutu · {font}px
            <input
              type="range"
              min={16}
              max={32}
              value={font}
              onChange={(e) => setFont(+e.target.value)}
            />
          </label>
        </div>
        <div
          className="type-preview"
          style={{
            fontSize: font,
            fontFamily: serif ? "var(--reading-font)" : "var(--ui-font)",
          }}
        >
          İyi okumak, nereye bakacağını bilmek kadar ne zaman duracağını da
          bilmektir.
        </div>
        <button className="button primary" type="submit">
          Kendi başlangıcımı tanıyayım <ArrowRight size={17} />
        </button>
        <p className="subtle">
          Verin bu tarayıcıda saklanır. Hesap, uzak sunucu veya otomatik cihaz
          eşitleme yok.
        </p>
      </form>
    </div>
  );
}
function download(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `izlek-okuma-gunlugu-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Settings({ store, go }: { store: Store; go: Navigate }) {
  const { state, update } = store;
  const [importData, setImportData] = useState<ReturnType<typeof fresh> | null>(
    null,
  );
  const [message, setMessage] = useState("");
  async function restore(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 2_000_000)
        throw Error(
          "Dosya 2 MB sınırını aşıyor. İzlek dışa aktarım dosyası seç.",
        );
      const data = JSON.parse(await file.text());
      if (!validState(data))
        throw Error(
          "Dosyanın biçimi, alanları veya sürümü uygun değil. Mevcut ilerleme değiştirilmedi.",
        );
      setImportData(data);
      setMessage("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Dosya okunamadı.");
    }
  }
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">TERCİHLER VE YEREL VERİ</span>
        <h1>
          Okuma masan,
          <br />
          <em>senin düzenin.</em>
        </h1>
        <p>Ayarların tüm kitap ve doğal okuma alanına uygulanır.</p>
      </div>
      <div className="settings-grid">
        <section className="paper-panel">
          <h2>Okuma rahatlığı</h2>
          <div className="theme-choices">
            <button
              className={state.prefs.theme === "light" ? "selected" : ""}
              onClick={() =>
                update((s) => ({ ...s, prefs: { ...s.prefs, theme: "light" } }))
              }
            >
              <Sun size={20} /> Kâğıt
            </button>
            <button
              className={state.prefs.theme === "dark" ? "selected" : ""}
              onClick={() =>
                update((s) => ({ ...s, prefs: { ...s.prefs, theme: "dark" } }))
              }
            >
              <Moon size={20} /> Gece
            </button>
          </div>
          <label className="field">
            Yazı boyutu · {state.prefs.font}px
            <input
              type="range"
              min={16}
              max={32}
              value={state.prefs.font}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  prefs: { ...s.prefs, font: +e.target.value },
                }))
              }
            />
          </label>
          <label className="field">
            Satır aralığı · {state.prefs.line}
            <input
              type="range"
              min={1.4}
              max={2.4}
              step={0.05}
              value={state.prefs.line}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  prefs: { ...s.prefs, line: +e.target.value },
                }))
              }
            />
          </label>
          <label className="field">
            Okuma genişliği · {state.prefs.width}px
            <input
              type="range"
              min={480}
              max={880}
              step={20}
              value={state.prefs.width}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  prefs: { ...s.prefs, width: +e.target.value },
                }))
              }
            />
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={state.prefs.serif}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  prefs: { ...s.prefs, serif: e.target.checked },
                }))
              }
            />
            <span>Kitap yazısını kullan · serif</span>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={state.prefs.sound}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  prefs: { ...s.prefs, sound: e.target.checked },
                }))
              }
            />
            <span>Oyunlarda kısa ses geri bildirimi</span>
          </label>
          <p className="subtle">
            Hareket azaltma tercihi cihazının erişilebilirlik ayarından alınır.
            Zamanlı araçların yanında durağan metin görünümü bulunur.
          </p>
          <div
            className="type-preview"
            style={{
              fontSize: state.prefs.font,
              lineHeight: state.prefs.line,
              fontFamily: state.prefs.serif
                ? "var(--reading-font)"
                : "var(--ui-font)",
            }}
          >
            Sözcükler bir araya gelir. Bir düşünce görünür olur. Kendine rahat
            bir satır aralığı bırak.
          </div>
        </section>
        <div>
          <section className="paper-panel">
            <h2>Kişisel yönün</h2>
            <label className="field">
              Adın
              <input
                value={state.profile.name}
                maxLength={60}
                onChange={(e) =>
                  update((s) => ({
                    ...s,
                    profile: { ...s.profile, name: e.target.value },
                  }))
                }
              />
            </label>
            <label className="field">
              Amacın
              <select
                value={state.profile.goal}
                onChange={(e) =>
                  update((s) => ({
                    ...s,
                    profile: { ...s.profile, goal: e.target.value as Goal },
                  }))
                }
              >
                {[
                  "Öğrenmek",
                  "Sınava hazırlanmak",
                  "Mesleki okuma",
                  "Keyif için okumak",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Günlük alanın
              <select
                value={state.profile.daily}
                onChange={(e) =>
                  update((s) => ({
                    ...s,
                    profile: {
                      ...s.profile,
                      daily: +e.target.value as 5 | 10 | 20,
                    },
                  }))
                }
              >
                {[5, 10, 20].map((x) => (
                  <option key={x} value={x}>
                    {x} dakika
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section className="paper-panel data-panel">
            <h2>Veri sende kalır.</h2>
            <p>
              İlerleme yalnızca bu tarayıcıda tutulur. Cihazlar arasında
              kendiliğinden eşitlenmez. Tarayıcı verisi silinirse kayıtlar da
              silinir; JSON dosyası kişisel yedeğindir.
            </p>
            <p className="subtle">
              Son 200 oturum, 80 oyun ve 40 hatırlama kaydı tutulur. Daha eski
              ayrıntılar zamanla listeden çıkar. En fazla 10 kendi metnini
              saklayabilirsin.
            </p>
            <div className="actions">
              <button className="button" onClick={() => download(state)}>
                <Download size={16} /> JSON dışa aktar
              </button>
              <label className="button file-button">
                <Upload size={16} /> Yedek seç
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    void restore(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {importData && (
              <div className="import-review">
                <h3>
                  Yedek hazır: {importData.results.length} okuma,{" "}
                  {importData.readLessons.length} okunan ders
                </h3>
                <p>
                  Geri yükleme mevcut ilerlemenin, ayarların ve sakladığın
                  metinlerin üzerine yazacak. Önce mevcut verini dışa
                  aktarabilirsin.
                </p>
                <div className="actions">
                  <button
                    className="button primary"
                    onClick={() => {
                      if (
                        update((s) => ({ ...importData, revision: s.revision }))
                      ) {
                        setImportData(null);
                        setMessage("Yedek geri yüklendi.");
                      }
                    }}
                  >
                    Mevcut verinin yerine geri yükle
                  </button>
                  <button
                    className="button"
                    onClick={() => setImportData(null)}
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            )}
            {message && <p role="status">{message}</p>}
            <hr />
            <button
              className="text-button danger"
              onClick={() => {
                if (
                  confirm(
                    "Bütün ders ilerlemesi, okuma ve oyun kayıtları, tercihler ve saklanan metinler bu tarayıcıdan silinecek. Bu işlem geri alınamaz; JSON yedeğin varsa yeniden yükleyebilirsin. Her şey sıfırlansın mı?",
                  )
                ) {
                  if (update((s) => ({ ...fresh(), revision: s.revision }))) {
                    setMessage("Yerel ilerleme sıfırlandı.");
                    go("home");
                  }
                }
              }}
            >
              <Trash2 size={16} /> Yerel ilerlemeyi sıfırla
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
function ResultTable({ results }: { results: Store["state"]["results"] }) {
  return (
    <div className="table-scroll">
      <table>
        <caption className="sr-only">
          Okuma oturumlarının koşulları ve sonuçları
        </caption>
        <thead>
          <tr>
            <th>Tarih / metin</th>
            <th>Biçim</th>
            <th>Anlama</th>
            <th>Doğal hız</th>
            <th>Aktif süre</th>
            <th>Koşullar</th>
          </tr>
        </thead>
        <tbody>
          {[...results].reverse().map((r) => (
            <tr key={r.id}>
              <td>
                <strong>{r.title}</strong>
                <small>
                  {new Date(r.date).toLocaleDateString("tr-TR")} · {r.purpose} ·{" "}
                  {r.readingId.startsWith("custom")
                    ? "Düzeyi belirlenmedi"
                    : `Düzey ${r.level}`}{" "}
                </small>
              </td>
              <td>{modeNames[r.mode]}</td>
              <td>
                {r.score === null ? "—" : `%${r.score}`}
                <small>
                  {r.mode === "scan"
                    ? "Kanıt seçimi"
                    : r.mode === "meaning"
                      ? "Açık metin"
                      : r.selfRecall !== undefined
                        ? `Öz değerlendirme %${r.selfRecall}`
                        : ""}
                </small>
              </td>
              <td>
                {r.wpm === null ? "—" : `${r.wpm} k/dk`}
                <small>
                  {r.words} kelime / {r.seconds.toFixed(1)} sn
                </small>
              </td>
              <td>
                {minutesLabel(r.seconds)}
                <small>Soru: {minutesLabel(r.questionSeconds)}</small>
              </td>
              <td>
                {r.complete ? "Tam" : "Kısmi"} ·{" "}
                {r.repeated ? "Tekrar" : "Yeni"}
                <small>
                  {r.interrupted ? "Kesintili" : "Kesinti yok"} ·{" "}
                  {r.helped ? "Yardımlı" : "Yardımsız"}
                </small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Progress({ store, go }: { store: Store; go: Navigate }) {
  const { state } = store;
  const [level, setLevel] = useState(2);
  const [purpose, setPurpose] = useState("Genel anlama");
  const [historyMode, setHistoryMode] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const comparisons = state.results.filter(
    (r) =>
      comparable(r) &&
      !r.readingId.startsWith("custom") &&
      r.level === level &&
      r.purpose === purpose,
  );
  const chart = comparisons.slice(-8);
  const observed = state.results.filter(
    (r) =>
      r.complete &&
      r.seconds >= 15 &&
      !r.repeated &&
      !r.helped &&
      ["natural", "long"].includes(r.mode) &&
      !r.readingId.startsWith("custom"),
  );
  const skillNames = [
    "Ana düşünce",
    "Açık bilgi",
    "İlişki",
    "Çıkarım",
    "Bağlam",
  ];
  const recall = state.recalls.filter((r) => r.done);
  const completed = lessons.filter((l) => lessonDone(state, l.id)).length;
  const final = state.results.some(
    (r) => r.assessment === "final" && r.complete,
  );
  const cohort = new Set(comparisons.map((r) => r.readingId));
  const best =
    cohort.size >= 3
      ? comparisons
          .filter((r) => r.score! >= 80)
          .reduce<
            (typeof comparisons)[number] | null
          >((best, r) => (!best || r.wpm! > best.wpm! ? r : best), null)
      : null;
  const eligibleAssess = state.results.filter(
    (r) => r.assessment && comparable(r),
  );
  const baseline = eligibleAssess.find((r) => r.assessment === "baseline");
  const finish = eligibleAssess.filter((r) => r.assessment === "final").at(-1);
  const pair =
    baseline &&
    finish &&
    baseline.level === finish.level &&
    baseline.purpose === finish.purpose;
  const visible = state.results.filter(
    (r) => historyMode === "all" || r.mode === historyMode,
  );
  const values = chart.map((r) => r.wpm!);
  const max = Math.max(250, ...values) * 1.12;
  const x = (i: number) =>
    chart.length === 1 ? 300 : 40 + (i / (chart.length - 1)) * 520;
  const y = (value: number) => 170 - (value / max) * 135;
  return (
    <>
      <div className="page-heading split-heading">
        <div>
          <span className="eyebrow">GELİŞİM GÜNLÜĞÜ</span>
          <h1>
            Sayıların ardında,
            <br />
            <em>senin okuma hikâyen.</em>
          </h1>
          <p>
            Hız, anlama ve hatırlama ayrı izler bırakır. İlerlemeyi koşullarıyla
            birlikte oku.
          </p>
        </div>
        <button className="button" onClick={() => go("assessment", "baseline")}>
          Değerlendirmeler <ArrowRight size={16} />
        </button>
      </div>
      {!state.results.length ? (
        <div className="empty-progress">
          <div className="empty-chart" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <BookOpen size={42} />
          </div>
          <div>
            <span className="eyebrow">HİKÂYEN BURADA BAŞLAYACAK</span>
            <h2>İlk çizgiyi bir okumayla at.</h2>
            <p>
              Henüz gözlem yok. Başlangıç değerlendirmenle doğal hızını ve anlam
              ilişkilerini ayrı görmeye başla.
            </p>
            <button
              className="button primary"
              onClick={() => go("assessment", "baseline")}
            >
              Başlangıcımı tanıyayım <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="milestone-strip">
            <div>
              <strong>{state.results.filter((r) => r.complete).length}</strong>
              <span>Tamamlanan çalışma</span>
            </div>
            <div>
              <strong>{new Set(observed.map((r) => r.readingId)).size}</strong>
              <span>Yeni, yardımsız metin</span>
            </div>
            <div>
              <strong>
                {completed}
                <small> /16</small>
              </strong>
              <span>Ders ve pratik</span>
            </div>
            <div>
              <strong>{recall.length}</strong>
              <span>Gecikmeli dönüş</span>
            </div>
          </div>
          <section className="chart-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">BENZER KOŞULLARI YAN YANA KOY</span>
                <h2>Doğal okumadaki gözlemlerin</h2>
              </div>
              <div className="actions">
                <select
                  aria-label="Grafik metin düzeyi"
                  value={level}
                  onChange={(e) => setLevel(+e.target.value)}
                >
                  {[1, 2, 3].map((x) => (
                    <option key={x} value={x}>
                      Düzey {x}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Grafik okuma amacı"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  {[
                    ...new Set([
                      "Genel anlama",
                      state.profile.goal,
                      ...state.results.map((r) => r.purpose),
                    ]),
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="subtle">
              Yalnızca yeni, tamamlanmış, yardımsız ve kesinti işareti olmayan
              doğal okumalar. Aynı amaç ve düzey. Son {chart.length} /{" "}
              {comparisons.length} gözlem.
            </p>
            {chart.length ? (
              <>
                <div className="chart-label">
                  <span className="legend-dot" /> Doğal hız · kelime/dakika
                </div>
                <svg
                  className="speed-chart"
                  viewBox="0 0 600 210"
                  role="img"
                  aria-label={`${chart.length} doğal okuma hızı: ${chart.map((r) => `${r.title}: ${r.wpm} kelime/dakika`).join("; ")}`}
                >
                  <line
                    x1="25"
                    y1="170"
                    x2="575"
                    y2="170"
                    className="chart-gridline"
                  />
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <g key={f}>
                      <line
                        x1="25"
                        y1={y(max * f)}
                        x2="575"
                        y2={y(max * f)}
                        className="chart-gridline"
                      />
                      <text x="0" y={y(max * f) + 4} className="chart-axis">
                        {Math.round(max * f)}
                      </text>
                    </g>
                  ))}
                  {chart.length > 1 && (
                    <polyline
                      points={chart
                        .map((r, i) => `${x(i)},${y(r.wpm!)}`)
                        .join(" ")}
                      className="chart-line"
                    />
                  )}
                  {chart.map((r, i) => (
                    <g key={r.id}>
                      <circle
                        cx={x(i)}
                        cy={y(r.wpm!)}
                        r="5"
                        className="chart-point"
                      />
                      <text
                        x={x(i)}
                        y={y(r.wpm!) - 13}
                        textAnchor="middle"
                        className="chart-value"
                      >
                        {r.wpm}
                      </text>
                      <text
                        x={x(i)}
                        y="200"
                        textAnchor="middle"
                        className="chart-axis"
                      >
                        {new Date(r.date).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </text>
                    </g>
                  ))}
                </svg>
                <div className="chart-label comprehension">
                  <span className="legend-dot" /> Aynı okumaların anlama oranı ·
                  ayrı ölçü
                </div>
                <div className="comprehension-bars">
                  {chart.map((r) => (
                    <div key={r.id}>
                      <div style={{ height: `${r.score! * 0.8}px` }} />
                      <strong>%{r.score}</strong>
                      <small>
                        {r.answers.filter((a) => a.correct).length}/
                        {r.answers.length}
                      </small>
                    </div>
                  ))}
                </div>
                {best && (
                  <div className="personal-best">
                    <Leaf size={20} />
                    <p>
                      <strong>
                        {best.wpm} k/dk · anlam sorularında %{best.score}
                      </strong>
                      <span>
                        Bu amaç ve düzeyde, sorularda en az %80 ile kaydettiğin
                        en yüksek yeni doğal hız. {best.title}.
                      </span>
                    </p>
                  </div>
                )}
                <p className="notice">
                  {cohort.size < 3
                    ? "Henüz üç farklı metin yok; kesin bir eğilim söylemek için erken."
                    : "Birden fazla yeni metinden kişisel gözlemler var. Metinler standart eşdeğer testler olmadığından değişimi kesin eğitim etkisi saymıyoruz."}
                </p>
              </>
            ) : (
              <div className="small-empty">
                <p>
                  Bu koşullara uyan kayıt henüz yok. Başka amaç veya düzey
                  seçebilir ya da yeni doğal okumayla başlayabilirsin.
                </p>
                <button
                  className="text-button"
                  onClick={() => go("studio", "natural")}
                >
                  Yeni doğal okuma <ArrowRight size={15} />
                </button>
              </div>
            )}
          </section>
          <div className="progress-columns">
            <section className="paper-panel">
              <span className="eyebrow">NE TÜR BAĞLANTILAR KURUYORSUN?</span>
              <h2>Anlam becerileri</h2>
              {skillNames.map((skill) => {
                const a = observed
                  .slice(-20)
                  .flatMap((r) => r.answers.filter((a) => a.skill === skill));
                const n = a.length;
                const score = n
                  ? Math.round((a.filter((a) => a.correct).length / n) * 100)
                  : null;
                return (
                  <div className="skill-row" key={skill}>
                    <div>
                      <span>{skill}</span>
                      <strong>{score === null ? "—" : `%${score}`}</strong>
                    </div>
                    <div className="progress-track">
                      <div style={{ width: `${score || 0}%` }} />
                    </div>
                    <small>
                      {n} soru gözlemi{n < 3 ? " · henüz az veri" : ""}
                    </small>
                  </div>
                );
              })}
              <p className="subtle">
                Son 20 yeni ve yardımsız doğal/uzun okuma. Bu dağılım tek başına
                standart beceri seviyesi vermez.
              </p>
            </section>
            <section className="paper-panel">
              <span className="eyebrow">ZAMAN GEÇİNCE NE KALIYOR?</span>
              <h2>Hatırlama dönüşleri</h2>
              {recall.length ? (
                recall.slice(-5).map((r) => (
                  <div className="recall-history" key={r.id}>
                    <strong>
                      {byId(r.readingId)?.title || "Kayıtlı metin"}
                    </strong>
                    <span>Öz değerlendirme %{r.selfScore}</span>
                    <small>
                      {new Date(r.done!).toLocaleDateString("tr-TR")}
                    </small>
                  </div>
                ))
              ) : (
                <p>
                  Henüz gecikmeli hatırlama tamamlanmadı. Okumandan en az bir
                  gün sonra metni kapalı tutarak deneyeceksin.
                </p>
              )}
              <button className="text-button" onClick={() => go("recall")}>
                Hatırlama sıram <ArrowRight size={16} />
              </button>
              <hr />
              <h3>Okunmuş olmak, uygulanmış olmak.</h3>
              <p>
                {state.readLessons.length} dersin anlatımı okundu. {completed}{" "}
                derste anlatım, doğru anlam kararı ve tamamlanan pratik birlikte
                var.
              </p>
              <p className="subtle">
                Beceri için farklı metinlerde kanıt arıyoruz; tek dersi tekrar
                ederek genel ustalık puanı oluşmaz.
              </p>
            </section>
          </div>
          {pair && (
            <section className="paper-panel">
              <span className="eyebrow">BAŞLANGIÇ VE BİTİRME</span>
              <h2>Aynı koşullara yakın iki durak.</h2>
              <div className="comparison-pair">
                {[baseline!, finish!].map((r, i) => (
                  <div key={r.id}>
                    <span>{i === 0 ? "Başlangıç" : "Bitirme"}</span>
                    <h3>{r.title}</h3>
                    <strong>
                      {r.wpm} k/dk <em> · %{r.score} anlama</em>
                    </strong>
                    <p>
                      {r.words} kelime · {r.seconds.toFixed(1)} sn · Düzey{" "}
                      {r.level}
                    </p>
                  </div>
                ))}
              </div>
              <p className="subtle">
                İki kişisel gözlem yan yana. Metin farkı, gün ve diğer koşullar
                değişime katkıda bulunabilir.
              </p>
            </section>
          )}
          {completed === 16 && final && (
            <div className="completion-banner">
              <span className="eyebrow">KURS YOLU TAMAMLANDI</span>
              <h2>Artık kendi izini sür.</h2>
              <p>
                Haftana yeni bir amaçlı okuma, ertesi gün geri çağırma ve bir
                uzun okuma yerleştir. {state.profile.daily} dakikalık tercihin
                bir başlangıç; hayatına göre değiştir.
              </p>
              <button className="button primary" onClick={() => go("library")}>
                Yeni bir metin seç <ArrowRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
      <section className="history-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">KOŞULLARIYLA BİRLİKTE</span>
            <h2>Çalışma kayıtların</h2>
          </div>
          <select
            aria-label="Kayıt sunum biçimi"
            value={historyMode}
            onChange={(e) => setHistoryMode(e.target.value)}
          >
            <option value="all">Tüm biçimler</option>
            {Object.entries(modeNames).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        {visible.length ? (
          <>
            <ResultTable results={showAll ? visible : visible.slice(-10)} />
            {visible.length > 10 && (
              <button
                className="text-button"
                onClick={() => setShowAll((x) => !x)}
              >
                {showAll ? "Son 10 kaydı göster" : "Tüm kayıtları göster"}
              </button>
            )}
          </>
        ) : (
          <p className="subtle">Bu görünümde henüz kayıt yok.</p>
        )}
        <details className="history-notes">
          <summary>Yazdığım özetler ve dönüş notları</summary>
          {state.results.filter((r) => r.note || r.summary).length ? (
            state.results
              .filter((r) => r.note || r.summary)
              .slice(-20)
              .reverse()
              .map((r) => (
                <article key={r.id}>
                  <h3>{r.title}</h3>
                  <p className="preserve">{r.summary}</p>
                  <p className="preserve">{r.note}</p>
                </article>
              ))
          ) : (
            <p>Oturum sonlarında yazdığın notlar burada yer alır.</p>
          )}
        </details>
        <details className="history-notes">
          <summary>Oyun günlüğü · okuma ölçümlerinden ayrı</summary>
          {state.games.length ? (
            <table>
              <thead>
                <tr>
                  <th>Oyun</th>
                  <th>Tarih</th>
                  <th>Doğruluk</th>
                  <th>Deneme</th>
                </tr>
              </thead>
              <tbody>
                {state.games
                  .slice(-20)
                  .reverse()
                  .map((g) => (
                    <tr key={g.id}>
                      <td>
                        {{
                          sequence: "Hikâyenin ipi",
                          evidence: "Kanıt dedektifi",
                          links: "Anlam köprüleri",
                          memory: "Fikir hafızası",
                        }[g.game] || g.game}
                      </td>
                      <td>{new Date(g.date).toLocaleDateString("tr-TR")}</td>
                      <td>%{g.score}</td>
                      <td>{g.moves}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p>Oyun tamamladığında kendi günlüğüne kaydolur.</p>
          )}
        </details>
      </section>
      <details className="measurement-note">
        <summary>İzlek neyi ölçer, neyi ölçmez?</summary>
        <p>
          Doğal hız = tamamlandığını bildirdiğin metnin kelime sayısı ÷ aktif
          okuma saniyesi × 60. 15 saniyeden kısa veya kısmi okumadan hız
          üretilmez. Soru süresi, hazırlık ve duraklama ayrı tutulur. Kelime
          sayımında Unicode harf ve sayılar kullanılır; kelime içi kesme ve tire
          birleştirir. Örnek: Ankara’da, e-posta, 2026 birer birimdir. Noktalama
          tek başına kelime değildir.
        </p>
        <p>
          Hız ile anlamayı çarpan bir “gerçek hız” skoru yoktur. Göz konumu,
          sabitleme süresi ve iç ses ölçülmez. Kaydırma tamamlanma kanıtı
          değildir. Oyunlar ve sunum tempoları doğal okumayı temsil etmez. Özet
          ve hatırlama işaretleri öz değerlendirmedir. Yerel uygulama sunucu
          destekli hile güvencesi sunmaz.
        </p>
        <p>
          Başlangıç, ara ve bitirme metinleri ayrı tutulur. Kitap ve örnekler
          öğretim; stüdyo pratik; ayrılmış metinler kişisel değerlendirme
          içindir. Kayıt saklama sınırı nedeniyle günlüğün çok eski ayrıntıları
          zamanla çıkar.
        </p>
      </details>
    </>
  );
}
function RecommendedReader({ store, go }: { store: Store; go: Navigate }) {
  const [selection] = useState(() => {
    const rec = recommend(store.state);
    const mode = rec.mode || "natural";
    const preferred = byId(rec.readingId || "r08");
    const candidates = readings.filter(
      (r) =>
        r.role === "practice" &&
        r.modes.includes(mode) &&
        !store.state.exposure[r.id] &&
        r.level === rec.level,
    );
    const fallback =
      readings.find(
        (r) =>
          r.role === "practice" &&
          r.modes.includes(mode) &&
          !store.state.exposure[r.id],
      ) ??
      preferred ??
      readings[0];
    if (!fallback) throw new Error("Okuma kütüphanesi boş; öneri üretilemedi.");
    const freshPreferred =
      preferred &&
      !store.state.exposure[preferred.id] &&
      preferred.level === rec.level &&
      preferred.modes.includes(mode)
        ? preferred
        : undefined;
    const chosen = freshPreferred ?? candidates[0] ?? fallback;
    return { reading: chosen, mode, tempo: rec.tempo, reason: rec.reason };
  });
  return (
    <>
      <p className="recommendation-context">{selection.reason}</p>
      <Reader
        reading={selection.reading}
        initialMode={selection.mode}
        initialTempo={selection.tempo}
        store={store}
        onExit={() => go("home")}
        onLesson={(id) => go("book", id)}
        onTransfer={() => go("studio", "natural")}
      />
    </>
  );
}
