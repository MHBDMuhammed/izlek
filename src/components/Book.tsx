import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Play,
  ChevronRight,
} from "lucide-react";
import { lessons, chapters } from "../content/lessons";
import { gameInfo } from "../content/games";
import { type Store, lessonDone } from "../core";
import type { Navigate } from "../App";
export function Course({ store, go }: { store: Store; go: Navigate }) {
  const done = lessons.filter((l) => lessonDone(store.state, l.id)).length;
  const baseline = store.state.results.some(
    (r) => r.assessment === "baseline" && r.complete,
  );
  const midpoint = store.state.results.some(
    (r) => r.assessment === "mid" && r.complete,
  );
  const final = store.state.results.some(
    (r) => r.assessment === "final" && r.complete,
  );
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">
          DÖRT AŞAMA · ON ALTI DERS · KENDİ RİTMİNDE
        </span>
        <h1>
          Okuma bir yolculuk.
          <br />
          <em>Her adımın bir anlamı var.</em>
        </h1>
        <p>
          Anlatımı öğren, kısa bir karar ver, yeni metinde uygula. Dersler açık;
          sıradaki adımın sana bir öneri.
        </p>
      </div>
      <div className="course-summary">
        <span>
          {done}
          <small> / 16 ders</small>
        </span>
        <div className="progress-track">
          <div style={{ width: `${(done / 16) * 100}%` }} />
        </div>
        <p>
          {done === 16 && final
            ? "Kurs yolu tamamlandı. Kitap ve bağımsız stüdyo seninle kalıyor."
            : "Ders tamamlama: anlatım + anlam kararı + bağlı pratik. Bu, tek başına beceri ustalığı puanı değildir."}
        </p>
      </div>
      <button
        className="assessment-stop"
        onClick={() => go("assessment", "baseline")}
      >
        <span className="step-mark">
          {baseline ? <Check size={20} /> : <span>○</span>}
        </span>
        <div>
          <span className="eyebrow">İLK DURAK</span>
          <h3>Başlangıç profilini tanı</h3>
          <p>Yeni metin, doğal okuma ve anlam soruları.</p>
        </div>
        <ArrowRight size={21} />
      </button>
      {chapters.map((chapter, ci) => (
        <section className="course-chapter" key={chapter}>
          <div className="chapter-heading">
            <span className="chapter-number">
              {["I", "II", "III", "IV"][ci]}
            </span>
            <div>
              <span className="eyebrow">
                {["BAŞLANGIÇ", "AKICILIK", "DERİNLİK", "BAĞIMSIZLIK"][ci]}
              </span>
              <h2>{chapter.split(" · ")[1]}</h2>
            </div>
          </div>
          {lessons
            .filter((l) => l.chapter === chapter)
            .map((l) => (
              <button
                className="lesson-row"
                onClick={() => go("book", l.id)}
                key={l.id}
              >
                <span
                  className={`lesson-status ${lessonDone(store.state, l.id) ? "done" : ""}`}
                >
                  {lessonDone(store.state, l.id) ? (
                    <Check size={17} />
                  ) : (
                    l.id.slice(1)
                  )}
                </span>
                <div>
                  <h3>{l.title}</h3>
                  <p>{l.subtitle}</p>
                  <div className="mini-status">
                    <span>
                      {store.state.readLessons.includes(l.id) ? "✓" : "○"}{" "}
                      Anlatım
                    </span>
                    <span>
                      {store.state.decisions.includes(l.id) ? "✓" : "○"} Karar
                    </span>
                    <span>
                      {store.state.results.some(
                        (r) => r.lessonId === l.id && r.complete,
                      )
                        ? "✓"
                        : "○"}{" "}
                      Pratik
                    </span>
                  </div>
                </div>
                <span className="lesson-duration">~{l.minutes} dk</span>
                <ChevronRight size={20} />
              </button>
            ))}
          {ci === 1 && (
            <button
              className="assessment-stop inset"
              onClick={() => go("assessment", "mid")}
            >
              <span className="step-mark">
                {midpoint ? <Check size={20} /> : "◎"}
              </span>
              <div>
                <h3>Ara değerlendirme</h3>
                <p>Sekiz dersten sonra yeni metinde bir gözlem.</p>
              </div>
              <ArrowRight size={20} />
            </button>
          )}
        </section>
      ))}
      <button
        className="assessment-stop final-stop"
        onClick={() => go("assessment", "final")}
      >
        <span className="step-mark">{final ? <Check size={20} /> : "✳"}</span>
        <div>
          <span className="eyebrow">YENİ BİR BAŞLANGIÇ</span>
          <h3>Bitirme ve kişisel okuma planın</h3>
          <p>Yeni içerikte aktarımını gözle; çalışma düzenini kur.</p>
        </div>
        <ArrowRight size={20} />
      </button>
    </>
  );
}
export default function Book({
  store,
  go,
  id,
}: {
  store: Store;
  go: Navigate;
  id?: string;
}) {
  const requestedId = id || store.state.book.id;
  const lesson =
    lessons.find((l) => l.id === requestedId) ?? lessons[0];
  const index = lesson ? lessons.indexOf(lesson) : -1;
  const [choice, setChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState(false);
  const initialScroll =
    store.state.book.id === (lesson?.id ?? requestedId)
      ? store.state.book.scroll
      : 0;
  const savedScroll = useRef(initialScroll);
  const scrollPosition = useRef(initialScroll);
  const [toc, setToc] = useState(false);
  const [notice, setNotice] = useState("");
  const prefs = store.state.prefs;
  const read = lesson
    ? store.state.readLessons.includes(lesson.id)
    : false;
  const passed = lesson ? store.state.decisions.includes(lesson.id) : false;
  const lessonId = lesson?.id;
  useEffect(() => {
    if (!lessonId) return;
    const startScroll = savedScroll.current;
    store.update((s) => ({
      ...s,
      book: { id: lessonId, scroll: startScroll },
    }));
    const frame = requestAnimationFrame(() => window.scrollTo(0, startScroll));
    let handle: number;
    const persist = () => {
      scrollPosition.current = window.scrollY;
      clearTimeout(handle);
      handle = window.setTimeout(
        () =>
          store.update((s) => ({
            ...s,
            book: { id: lessonId, scroll: window.scrollY },
          })),
        650,
      );
    };
    window.addEventListener("scroll", persist, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(handle);
      window.removeEventListener("scroll", persist);
      store.update((s) => ({
        ...s,
        book: { id: lessonId, scroll: scrollPosition.current },
      }));
    };
    // store.update writes the same book position; adding `store` would retrigger scroll persistence on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);
  if (!lesson) return null;
  const current = lesson;
  function answer() {
    if (choice === null) return;
    setFeedback(true);
    if (choice === current.decision.answer)
      store.update((s) => ({
        ...s,
        decisions: [...new Set([...s.decisions, current.id])],
      }));
  }
  const associated = gameInfo.find((g) => g.lesson === current.id);
  return (
    <div className="book-layout">
      <aside className={`book-toc ${toc ? "toc-open" : ""}`}>
        <span className="eyebrow">İZLEK OKUMA KİTABI</span>
        <h2>
          Bir metnin
          <br />
          <em>içinden geçmek.</em>
        </h2>
        <button
          className="text-button mobile-only"
          onClick={() => setToc(false)}
        >
          İçindekileri kapat
        </button>
        {chapters.map((c) => (
          <div key={c}>
            <h4>{c}</h4>
            {lessons
              .filter((l) => l.chapter === c)
              .map((l) => (
                <button
                  key={l.id}
                  className={l.id === current.id ? "active" : ""}
                  onClick={() => {
                    setToc(false);
                    go("book", l.id);
                  }}
                >
                  <span>{l.id.slice(1)}</span>
                  {l.title}
                  {store.state.bookmarks.includes(l.id) && (
                    <Bookmark size={12} />
                  )}
                </button>
              ))}
          </div>
        ))}
        <div className="book-note">
          Kitap okuma konumun ve yer imlerin bu tarayıcıda tutulur. Okundu
          işareti, pratik beceri kaydından ayrıdır.
        </div>
      </aside>
      <article className="book-article">
        <div className="book-tools">
          <button
            className="text-button mobile-only"
            onClick={() => setToc(!toc)}
          >
            <BookOpen size={16} /> İçindekiler
          </button>
          <span className="eyebrow">{current.chapter}</span>
          <button
            className={`icon-button ${store.state.bookmarks.includes(current.id) ? "active" : ""}`}
            aria-label={
              store.state.bookmarks.includes(current.id)
                ? "Yer imini kaldır"
                : "Yer imi ekle"
            }
            onClick={() =>
              store.update((s) => ({
                ...s,
                bookmarks: s.bookmarks.includes(current.id)
                  ? s.bookmarks.filter((x) => x !== current.id)
                  : [...s.bookmarks, current.id],
              }))
            }
          >
            <Bookmark
              size={19}
              fill={
                store.state.bookmarks.includes(current.id)
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>
        <header className="book-title">
          <span className="chapter-leaf">{current.id.slice(1)}</span>
          <h1>{current.title}</h1>
          <p>{current.subtitle}</p>
          <span className="eyebrow">
            {current.skill} · ANLATIM VE UYGULAMA ~{current.minutes} DK
          </span>
        </header>
        <div
          className="book-prose"
          style={{
            fontSize: prefs.font,
            lineHeight: prefs.line,
            fontFamily: prefs.serif ? "var(--reading-font)" : "var(--ui-font)",
            maxWidth: prefs.width,
          }}
        >
          {current.sections.map((section, i) => (
            <section key={i}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </section>
          ))}
        </div>
        <aside className="worked-example">
          <span className="eyebrow">BİRLİKTE BAKALIM</span>
          <div>
            <span className="example-label">İlk bakış</span>
            <p>{current.example.before}</p>
          </div>
          <div>
            <span className="example-label">Anlamı koruyan bakış</span>
            <p>{current.example.after}</p>
          </div>
          <p className="explanation">{current.example.explanation}</p>
        </aside>
        <section className="current-decision">
          <span className="eyebrow">ŞİMDİ KARAR SENDE</span>
          <h3>{current.decision.prompt}</h3>
          <div className="decision-options">
            {current.decision.options.map((o, i) => (
              <label
                className={`answer ${choice === i ? "selected" : ""}`}
                key={i}
              >
                <input
                  type="radio"
                  name="current-choice"
                  checked={choice === i}
                  onChange={() => {
                    setChoice(i);
                    setFeedback(false);
                  }}
                />
                <span className="answer-letter">{"ABC"[i]}</span>
                {o}
              </label>
            ))}
          </div>
          <button
            className="button"
            disabled={choice === null}
            onClick={answer}
          >
            Kararımı kontrol et
          </button>
          {(feedback || passed) && (
            <div className="decision-feedback" role="status">
              <strong>
                {feedback
                  ? choice === current.decision.answer
                    ? "✓ İlişkiyi yakaladın."
                    : "↺ Bir kez daha düşün."
                  : "✓ Bu anlam kararını daha önce tamamladın."}
              </strong>
              <p>{current.decision.why}</p>
            </div>
          )}
        </section>
        <aside className="mistake">
          <span className="eyebrow">SIK DÜŞÜLEN TUZAK</span>
          <p>{current.mistake}</p>
        </aside>
        <div className="takeaway">
          <span className="eyebrow">CEBİNDE KALSIN</span>
          {current.takeaway.map((t) => (
            <p key={t}>
              <Check size={17} />
              {t}
            </p>
          ))}
        </div>
        <div className="book-actions">
          <button
            className={`button ${read ? "" : "primary"}`}
            onClick={() => {
              if (
                store.update((s) => ({
                  ...s,
                  readLessons: [...new Set([...s.readLessons, current.id])],
                  book: { id: current.id, scroll: window.scrollY },
                }))
              )
                setNotice(
                  "Anlatım okundu olarak kaydedildi. Pratik ayrı izlenecek.",
                );
            }}
          >
            <Check size={17} />
            {read ? "Anlatımı okudun" : "Anlatımı okudum"}
          </button>
          <span role="status">{notice}</span>
        </div>
        <div className="current-practice">
          <span className="eyebrow">ŞİMDİ YENİ METİNDE DENE</span>
          <h2>{current.skill}, uygulamada.</h2>
          <p>{current.practice}</p>
          <button
            className="button primary"
            onClick={() =>
              go(
                "reader",
                current.id === "l13" &&
                  store.state.profile.goal === "Sınava hazırlanmak"
                  ? "r25"
                  : current.reading,
                {
                  mode:
                    current.id === "l13" &&
                    store.state.profile.goal === "Sınava hazırlanmak"
                      ? "natural"
                      : current.mode,
                  lessonId: current.id,
                },
              )
            }
          >
            <Play size={17} /> Ders pratiğine başla
          </button>
          {associated && (
            <button
              className="text-button"
              onClick={() => go("games", associated.id)}
            >
              İlgili oyun: {associated.title} <ArrowRight size={15} />
            </button>
          )}
        </div>
        <p className="subtle">{current.next}</p>
        <nav className="book-pagination" aria-label="Kitap bölümleri">
          <button
            className="text-button"
            disabled={index === 0}
            onClick={() => {
              const prev = lessons[index - 1];
              if (prev) go("book", prev.id);
            }}
          >
            <ArrowLeft size={16} /> Önceki ders
          </button>
          <span>
            {index + 1} / {lessons.length}
          </span>
          <button
            className="text-button"
            onClick={() => {
              if (index === 15) {
                go("assessment", "final");
                return;
              }
              const nextLesson = lessons[index + 1];
              if (nextLesson) go("book", nextLesson.id);
            }}
          >
            {index === 15 ? "Bitirme çalışması" : "Sonraki ders"}{" "}
            <ArrowRight size={16} />
          </button>
        </nav>
      </article>
    </div>
  );
}
