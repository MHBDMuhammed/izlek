import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Bookmark,
  Settings2,
  Eye,
  ChevronLeft,
  Clock3,
  BookOpen,
} from "lucide-react";
import {
  type Store,
  type Result,
  useClock,
  comparable,
  expose,
} from "../core";
import type { Reading, Mode } from "../content/types";
import { minutesLabel, wordCount } from "../text";
import { Confirm } from "./Confirm";
export const modeNames: Record<Mode, string> = {
  natural: "Doğal okuma",
  guide: "Rehberli tempo",
  groups: "Anlam grupları",
  serial: "Seri sunum",
  skim: "Göz gezdirme",
  scan: "Bilgi tarama",
  meaning: "Anlama atölyesi",
  recall: "Hatırlama ve özet",
  long: "Uzun okuma",
};
const descriptions: Record<Mode, string> = {
  natural:
    "Normal paragraflarla, kendi hızında oku. Bitirdiğini sen bildirirsin; ardından metin kapanır ve anlam soruları açılır.",
  guide:
    "Cümle vurgusu bir ritim önerir. Yetişmen gerekmiyor: duraklat, geri dön veya doğal okumaya geç. Gösterim temposu okuma hızın değildir.",
  groups:
    "Birlikte anlam taşıyan sözcükleri izle. Dikey çizgiler editoryal grup sınırlarıdır; göz hareketi ölçülmez. Gruplardan sonra metnin bütününe dön.",
  serial:
    "Kelimeler aynı yerde sırayla gösterilir. Noktalama ve uzun sözcüklerde sunum yavaşlar. Bu deneyimin temposu doğal okuma hızın olarak kaydedilmez.",
  skim: "Önce başlık ve paragraf girişlerinden yönü tahmin et. Beklentini yaz; ardından metnin bütününü açıp ana düşünce sorusuyla karşılaştır.",
  scan: "Belirli bir bilgiyi bul. Cevabın geçtiği paragrafı seçip kısa yanıtını yaz. Tüm sayfa için okuma hızı üretilmez.",
  meaning:
    "Metin açıkken ana düşünce, ilişki ve çıkarımları incele. Doğru cevabın yanında dayanağını gör. Bu açık metin pratiğidir.",
  recall:
    "Önce oku, sonra metin kapalıyken kısa özetini yaz. Örnek özet ve fikir listesiyle karşılaştır. İşaretlerin öz değerlendirmedir.",
  long: "Bölümler arasındaki ilişkiyi koruyarak bütün metni oku. İstediğinde mola ver ve dönüş notu bırak. Sorular sonunda birlikte açılır.",
};
interface Props {
  reading: Reading;
  initialMode: Mode;
  store: Store;
  onExit: () => void;
  onLesson: (id: string) => void;
  onTransfer: () => void;
  lessonId?: string;
  assessment?: "baseline" | "mid" | "final";
  initialTempo?: number;
}
export default function Reader({
  reading,
  initialMode,
  store,
  onExit,
  onLesson,
  onTransfer,
  lessonId,
  assessment,
  initialTempo = 180,
}: Props) {
  const { state, update, saveResult, retryPending } = store;
  const [mode, setMode] = useState<Mode>(assessment ? "natural" : initialMode);
  const [stage, setStage] = useState<
    "prepare" | "reading" | "questions" | "result"
  >("prepare");
  const timer = useClock();
  const [tempo, setTempo] = useState(Math.max(60, Math.min(600, initialTempo)));
  const [groupSize, setGroupSize] = useState(1);
  const [limit, setLimit] = useState(0);
  const [purpose, setPurpose] = useState(
    assessment ? "Genel anlama" : state.profile.goal,
  );
  const [font, setFont] = useState(state.prefs.font);
  const [line, setLine] = useState(state.prefs.line);
  const [width, setWidth] = useState(state.prefs.width);
  const [position, setPosition] = useState(0);
  const [editingGroups, setEditingGroups] = useState("");
  const [parsedGroups, setParsedGroups] = useState<string[][] | null>(null);
  const [configError, setConfigError] = useState("");
  const [answers, setAnswers] = useState<number[]>([]);
  const [peek, setPeek] = useState(false);
  const [allText, setAllText] = useState(false);
  const [note, setNote] = useState("");
  const [summary, setSummary] = useState("");
  const [checked, setChecked] = useState<number[]>([]);
  const [showModel, setShowModel] = useState(false);
  const [comfort, setComfort] = useState<Result["comfort"]>("Dengeli");
  const [scanParagraph, setScanParagraph] = useState<number | null>(null);
  const [scanAnswer, setScanAnswer] = useState("");
  const [readParagraph, setReadParagraph] = useState(
    reading.paragraphs.length - 1,
  );
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [finishedText, setFinishedText] = useState(false);
  const id = useRef(crypto.randomUUID());
  const repeated = useRef(!!state.exposure[reading.id]);
  const seconds = useRef(0);
  const questionStart = useRef(0);
  const helped = useRef(false);
  const timedOut = useRef(false);
  const completed = useRef(false);
  const began = useRef(false);
  const planned = useRef(0);
  const changed = useRef(false);
  const groupDraft = reading.groups || parsedGroups;
  const units = useMemo(() => {
    if (mode === "groups") return (groupDraft || []).flat();
    if (mode === "guide")
      return reading.paragraphs.flatMap(
        (p) => p.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [p],
      );
    const tokens = reading.paragraphs.join(" ").split(/\s+/);
    return Array.from(
      { length: Math.ceil(tokens.length / groupSize) },
      (_, i) => tokens.slice(i * groupSize, (i + 1) * groupSize).join(" "),
    );
  }, [reading, mode, groupSize, groupDraft]);
  const visual = ["serial", "guide", "groups"].includes(mode);
  const textStyle = {
    fontSize: `${font}px`,
    lineHeight: line,
    maxWidth: `${width}px`,
    fontFamily: state.prefs.serif ? "var(--reading-font)" : "var(--ui-font)",
  };
  useEffect(() => {
    if (
      !visual ||
      timer.phase !== "active" ||
      stage !== "reading" ||
      position >= units.length
    )
      return;
    const unit = units[position] || "";
    const punctuation = /[.!?;:]$/.test(unit.trim())
      ? 1.5
      : /,$/.test(unit.trim())
        ? 1.2
        : 1;
    const length = unit.split(/\s+/).some((w) => w.length > 12) ? 1.2 : 1;
    const delay =
      (60000 / tempo) * Math.max(1, wordCount(unit)) * punctuation * length;
    const start = performance.now();
    let h: number;
    const tick = () => {
      if (performance.now() - start >= delay) {
        setPosition((p) => p + 1);
      } else h = window.setTimeout(tick, Math.min(50, delay));
    };
    h = window.setTimeout(tick, Math.min(50, delay));
    return () => clearTimeout(h);
  }, [visual, timer.phase, stage, position, units, tempo]);
  useEffect(() => {
    if (
      visual &&
      position >= units.length &&
      units.length &&
      timer.phase === "active"
    ) {
      timer.pause();
      queueMicrotask(() => setFinishedText(true));
    }
    // timer is a per-render handle from useClock; subscribe to timer.phase, not the handle identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, units.length, visual, timer.phase]);
  useEffect(() => {
    if (
      limit &&
      timer.elapsed >= limit &&
      timer.phase === "active" &&
      !timedOut.current
    ) {
      timedOut.current = true;
      timer.pause(true);
    }
    // Same per-render handle reason as above; limit/timeout reads the elapsed snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.elapsed, limit, timer.phase]);
  useEffect(() => {
    if (stage !== "reading") return;
    const warning = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warning);
    return () => window.removeEventListener("beforeunload", warning);
  }, [stage]);
  function begin() {
    if (began.current) return;
    if (mode === "groups" && !groupDraft) {
      const lines = editingGroups
        .split("\n")
        .filter((x) => x.trim())
        .map((l) =>
          l
            .split("|")
            .map((x) => x.trim())
            .filter(Boolean),
        );
      if (!lines.length || !lines.some((g) => g.length > 1)) {
        setConfigError(
          "Grupları | ile ayır. En az bir cümlede iki anlam grubu seç.",
        );
        return;
      }
      if (
        lines.flat().join(" ").replace(/\s+/g, " ").trim() !==
        reading.paragraphs.join(" ").replace(/\s+/g, " ").trim()
      ) {
        setConfigError(
          "Metnin bütün sözcüklerini ve noktalamasını koru; yalnızca | işaretleri ekle.",
        );
        return;
      }
      setParsedGroups(lines);
    }
    began.current = true;
    planned.current = limit;
    update((s) => expose(s, reading.id));
    setStage("reading");
    timer.start();
  }
  function finishReading(full: boolean) {
    if (completed.current) return;
    completed.current = true;
    seconds.current = timer.finish();
    setFinishedText(full);
    questionStart.current = performance.now();
    setStage("questions");
  }
  function submit() {
    if (result) return;
    const qs =
      mode === "skim"
        ? reading.questions.filter((q) => q.skill === "Ana düşünce")
        : reading.questions;
    const answered = !finishedText
      ? []
      : mode === "scan" && reading.scan
        ? [
            {
              skill: "Açık bilgi" as const,
              correct: scanParagraph === reading.scan.paragraph,
            },
          ]
        : mode === "recall"
          ? []
          : qs.map((q, i) => ({
              skill: q.skill,
              correct: answers[i] === q.answer,
            }));
    const score = answered.length
      ? Math.round(
          (answered.filter((a) => a.correct).length / answered.length) * 100,
        )
      : null;
    const usedWords = finishedText
      ? reading.words
      : wordCount(reading.paragraphs.slice(0, readParagraph + 1).join(" "));
    const measuredMode = assessment ? "natural" : initialMode;
    const isNatural =
      (measuredMode === "natural" || measuredMode === "long") &&
      !changed.current;
    const r: Result = {
      id: id.current,
      date: Date.now(),
      readingId: reading.id,
      contentVersion: reading.version,
      title: reading.title,
      mode: measuredMode,
      purpose,
      level: reading.level,
      words: usedWords,
      seconds: seconds.current,
      questionSeconds: (performance.now() - questionStart.current) / 1000,
      wpm:
        isNatural && finishedText && seconds.current >= 15
          ? Math.round((reading.words / seconds.current) * 60)
          : null,
      score,
      answers: answered,
      interrupted:
        timer.interrupted.current ||
        changed.current ||
        !finishedText ||
        !!(assessment && timer.phase === "paused"),
      repeated: repeated.current,
      complete: finishedText,
      assessment,
      lessonId,
      comfort,
      note,
      tempo: visual ? tempo : undefined,
      helped: helped.current,
      summary: summary || undefined,
      selfRecall:
        mode === "recall" && showModel
          ? Math.round(
              (checked.length / Math.max(1, reading.points.length)) * 100,
            )
          : undefined,
      plannedSeconds: planned.current || null,
      settingsChanged: changed.current,
    };
    setResult(r);
    setStage("result");
    setSavedId(r.id);
    setSaved(saveResult(r));
  }
  useEffect(() => {
    if (stage !== "questions") return;
    const interrupt = () => {
      timer.interrupted.current = true;
    };
    window.addEventListener("blur", interrupt);
    document.addEventListener("visibilitychange", interrupt);
    return () => {
      window.removeEventListener("blur", interrupt);
      document.removeEventListener("visibilitychange", interrupt);
    };
    // timer.interrupted is a mutable ref mirror; the question-stage subscription only depends on stage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);
  const [confirming, setConfirming] = useState<null | "exit" | "restart">(null);
  function exit() {
    if (stage === "reading" || stage === "questions") {
      timer.pause(true);
      setConfirming("exit");
      return;
    }
    onExit();
  }
  function naturalTransfer() {
    changeMode();
    setFinishedText(false);
    timer.start();
  }
  function changeMode() {
    timer.pause(true);
    changed.current = true;
    helped.current = true;
    setMode("natural");
    setPosition(0);
    setAllText(true);
  }
  function pause() {
    timer.pause(true);
  }
  function requestRestart() {
    timer.pause(true);
    setConfirming("restart");
  }
  function doRestart() {
    timer.reset();
    id.current = crypto.randomUUID();
    repeated.current = !!state.exposure[reading.id];
    seconds.current = 0;
    questionStart.current = 0;
    helped.current = false;
    timedOut.current = false;
    completed.current = false;
    began.current = false;
    changed.current = false;
    planned.current = 0;
    setStage("prepare");
    setMode(assessment ? "natural" : initialMode);
    setPosition(0);
    setAnswers([]);
    setPeek(false);
    setAllText(false);
    setNote("");
    setSummary("");
    setChecked([]);
    setShowModel(false);
    setComfort("Dengeli");
    setScanParagraph(null);
    setScanAnswer("");
    setReadParagraph(reading.paragraphs.length - 1);
    setResult(null);
    setSaved(false);
    setFinishedText(false);
    setConfigError("");
  }

  const questions =
    mode === "skim"
      ? reading.questions.filter((q) => q.skill === "Ana düşünce")
      : reading.questions;
  const persisted =
    saved &&
    !store.conflict &&
    state.results.some((r) => r.id === (savedId ?? ""));
  const text = (
    <div className="reading-text" style={textStyle}>
      {reading.paragraphs.map((p, i) => (
        <p key={i}>
          <span className="paragraph-number" aria-label={`Paragraf ${i + 1}`}>
            {String(i + 1).padStart(2, "0")}
          </span>
          {p}
        </p>
      ))}
    </div>
  );
  return (
    <div className="reader-page">
      <header className="workspace-head">
        <button className="text-button" onClick={exit}>
          <ArrowLeft size={17} /> Çalışma alanından çık
        </button>
        <span className="eyebrow">
          {assessment ? "DEĞERLENDİRME" : modeNames[mode]}{" "}
          {lessonId ? " · DERS PRATİĞİ" : ""}
        </span>
        <span className="local-indicator">
          <span /> Yerel çalışma
        </span>
      </header>
      {stage === "prepare" ? (
        <div className="reading-setup">
          <div>
            <span className="eyebrow">
              {assessment
                ? `${{ baseline: "BAŞLANGIÇ", mid: "ARA", final: "BİTİRME" }[assessment]} DEĞERLENDİRMESİ`
                : "ANTRENMAN STÜDYOSU"}
            </span>
            <h1>
              {modeNames[mode]}
              <span className="serif accent">, kendi ritminde.</span>
            </h1>
            <p className="lead">
              {mode === "groups" && !reading.groups
                ? "Anlam sınırlarını kendin belirle; sonra seçtiğin grupları kontrollü tempoda izle. Bu ayrımlar otomatik dil çözümlemesi değildir."
                : descriptions[mode]}
            </p>
            <div className="selected-text">
              <BookOpen size={25} />
              <div>
                <span className="eyebrow">SEÇİLEN METİN</span>
                <h3>{reading.title}</h3>
                <p>
                  {reading.genre} ·{" "}
                  {reading.id.startsWith("custom")
                    ? "Düzeyi belirlenmedi"
                    : `Düzey ${reading.level}`}{" "}
                  · {reading.words} kelime
                </p>
              </div>
            </div>
            <p className="subtle">{reading.complexity}</p>
            {repeated.current && (
              <div className="notice">
                Bu metni daha önce açtın. Sonuç tekrar çalışması olarak
                etiketlenecek.
              </div>
            )}
            {assessment && (
              <div className="notice">
                <strong>Koşullar açık olsun.</strong> Metin başlayınca süre
                işler. Bitirdiğinde sorular metin kapalıyken açılır. Duraklama,
                sekme veya pencere değişimi kaydı kesintili yapar. Metni yeniden
                açarsan sonuç yardımlı sayılır. Bu özgün metinler
                standartlaştırılmış eşdeğer testler değildir.
              </div>
            )}
            {reading.id.startsWith("custom") && (
              <div className="notice">
                Bu metnin hazır soruları yok. Anlama puanı üretilmez; özetini
                kendin değerlendirebilirsin.
              </div>
            )}
            {mode === "groups" && !reading.groups && (
              <label className="field">
                Anlam gruplarını sen belirle{" "}
                <small>
                  Metni koru; birlikte çalışan parçaların arasına | koy.
                  Otomatik gruplama yapılmaz.
                </small>
                <textarea
                  rows={9}
                  value={editingGroups || reading.paragraphs.join("\n")}
                  onChange={(e) => setEditingGroups(e.target.value)}
                />
              </label>
            )}
            {mode === "scan" && reading.scan && (
              <div className="task-question">
                <span>ARADIĞIN BİLGİ</span>
                <h3>{reading.scan.prompt}</h3>
              </div>
            )}
          </div>
          <aside className="setup-controls">
            <span className="eyebrow">OKUMA MASANI HAZIRLA</span>
            {!assessment && (
              <>
                <label className="field">
                  Okuma amacı
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  >
                    {[
                      "Öğrenmek",
                      "Sınava hazırlanmak",
                      "Mesleki okuma",
                      "Keyif için okumak",
                      "Genel anlama",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Çalışma sınırı
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                  >
                    <option value={0}>Metni tamamla</option>
                    {[1, 2, 3, 5, 10].map((x) => (
                      <option value={x * 60} key={x}>
                        {x} dakika · sonra duraklat
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {visual && (
              <>
                <label className="field">
                  Gösterim temposu · {tempo}
                  <input
                    type="range"
                    min={60}
                    max={600}
                    step={10}
                    value={tempo}
                    onChange={(e) => setTempo(+e.target.value)}
                  />
                  <small>Kelime/dakika ayarı; ölçülmüş hız değil.</small>
                </label>
                {mode === "serial" && (
                  <label className="field">
                    Sunum grubu
                    <select
                      value={groupSize}
                      onChange={(e) => setGroupSize(+e.target.value)}
                    >
                      {[1, 2, 3, 4].map((x) => (
                        <option key={x} value={x}>
                          {x} kelime
                        </option>
                      ))}
                    </select>
                    <small>
                      Sabit boyutlu sunum grubu, dilsel anlam grubu değildir.
                    </small>
                  </label>
                )}
              </>
            )}
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
            <label className="field">
              Satır aralığı
              <select value={line} onChange={(e) => setLine(+e.target.value)}>
                {[1.5, 1.7, 1.85, 2.1, 2.3].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Okuma genişliği
              <select value={width} onChange={(e) => setWidth(+e.target.value)}>
                <option value={520}>Dar</option>
                <option value={680}>Dengeli</option>
                <option value={820}>Geniş</option>
              </select>
            </label>
            <button
              className="text-button"
              onClick={() => {
                if (
                  update((s) => ({
                    ...s,
                    prefs: { ...s.prefs, font, line, width },
                  }))
                )
                  setConfigError("Okuma tercihlerin kaydedildi.");
              }}
            >
              <Bookmark size={16} /> Tercihlerimi sakla
            </button>
            {configError && <p role="status">{configError}</p>}
            <button className="button primary full" onClick={begin}>
              <Play size={17} /> Okumayı başlat
            </button>
            <small>Hazırlık süresi ölçüme katılmaz.</small>
          </aside>
        </div>
      ) : null}
      {stage === "reading" && (
        <>
          <div className="reading-title">
            <span className="eyebrow">
              {reading.genre} /{" "}
              {reading.id.startsWith("custom")
                ? "DÜZEY BELİRLENMEDİ"
                : `DÜZEY ${reading.level}`}
            </span>
            <h1>{reading.title}</h1>
            <p>
              {reading.words} kelime · {purpose}
              {repeated.current ? " · Tekrar metni" : ""}
            </p>
          </div>
          <div className="reader-toolbar">
            <span>
              <Clock3 size={16} /> {minutesLabel(timer.elapsed)}
              {limit ? ` / ${minutesLabel(limit)}` : ""}
            </span>
            <button
              onClick={() =>
                timer.phase === "active" ? pause() : timer.start()
              }
              className="button small"
            >
              {timer.phase === "active" ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}{" "}
              {timer.phase === "active" ? "Duraklat" : "Sürdür"}
            </button>
            <button
              className="icon-button"
              aria-label="Yeni oturumla baştan başlat"
              onClick={requestRestart}
            >
              <RotateCcw size={16} />
            </button>
            {visual && (
              <>
                <button
                  aria-label="Bir önceki sunuma dön"
                  onClick={() => {
                    setPosition((p) => Math.max(0, p - 1));
                    setFinishedText(false);
                    helped.current = true;
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <label className="inline-label">
                  Tempo
                  <select
                    aria-label="Gösterim temposu"
                    value={tempo}
                    disabled={timer.phase === "active"}
                    onChange={(e) => {
                      setTempo(+e.target.value);
                      changed.current = true;
                    }}
                  >
                    {[
                      ...new Set([
                        60,
                        90,
                        120,
                        150,
                        180,
                        210,
                        240,
                        270,
                        300,
                        360,
                        420,
                        480,
                        540,
                        600,
                        tempo,
                      ]),
                    ]
                      .sort((a, b) => a - b)
                      .map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                  </select>
                </label>
                <button className="text-button" onClick={changeMode}>
                  <Eye size={16} /> Doğal görünüme dön
                </button>
              </>
            )}
            {!visual && (
              <details>
                <summary>
                  <Settings2 size={16} /> Görünüm
                </summary>
                <label>
                  Yazı boyutu
                  <input
                    aria-label="Yazı boyutu"
                    type="range"
                    min={16}
                    max={32}
                    value={font}
                    onChange={(e) => {
                      setFont(+e.target.value);
                      changed.current = true;
                    }}
                  />
                </label>
                <label>
                  Satır aralığı
                  <input
                    aria-label="Satır aralığı"
                    type="range"
                    min={1.4}
                    max={2.4}
                    step={0.1}
                    value={line}
                    onChange={(e) => {
                      setLine(+e.target.value);
                      changed.current = true;
                    }}
                  />
                </label>
              </details>
            )}
          </div>
          {timer.phase === "paused" ? (
            <div className="pause-sheet">
              <span className="orb">
                <Pause />
              </span>
              <h2>{finishedText ? "Sunum tamamlandı." : "Bir nefes arası."}</h2>
              <p>
                {timedOut.current
                  ? "Seçtiğin süre doldu. Kaldığın yere göre kaydet veya süre sınırını kaldırıp sürdür."
                  : timer.interrupted.current
                    ? "Pencere veya sekme değiştiği için çalışma duraklatıldı. Kayıt kesintili olarak korunacak."
                    : "Süre durdu. Hazır olduğunda kaldığın yerden devam et."}
              </p>
              {mode === "long" && (
                <label className="field">
                  Dönüş notun
                  <textarea
                    value={note}
                    maxLength={3000}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Son anladığım ilişki…"
                  />
                </label>
              )}
              {!finishedText && (
                <button
                  className="button primary"
                  onClick={() => {
                    if (timedOut.current) setLimit(0);
                    timer.start();
                  }}
                >
                  <Play size={16} />{" "}
                  {timedOut.current ? "Sınırı kaldır ve sürdür" : "Devam et"}
                </button>
              )}
              {finishedText && (
                <button
                  className="button primary"
                  onClick={() =>
                    mode === "groups" ? naturalTransfer() : finishReading(true)
                  }
                >
                  {mode === "groups"
                    ? "Şimdi metnin bütününü oku"
                    : "Anlam çalışmasına geç"}{" "}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          ) : (
            <div className="reading-paper">
              {mode === "serial" ? (
                <div className="serial-stage">
                  <span className="eyebrow">
                    SERİ SUNUM · {Math.min(position + 1, units.length)} /{" "}
                    {units.length}
                  </span>
                  <div className="serial-word" style={{ fontSize: font * 1.8 }}>
                    {units[position] || "Sunum tamamlandı"}
                  </div>
                  <div className="serial-anchor" />
                  <p>
                    Duraklatıp geri dönebilirsin. Durağan metin için doğal
                    görünüme geç.
                  </p>
                </div>
              ) : mode === "groups" ? (
                <div className="reading-text grouped" style={textStyle}>
                  {groupDraft?.map((sentence, i) => (
                    <p key={i}>
                      {sentence.map((g, j) => {
                        const index =
                          groupDraft
                            .slice(0, i)
                            .reduce((n, x) => n + x.length, 0) + j;
                        return (
                          <span
                            key={j}
                            className={index === position ? "active-group" : ""}
                          >
                            {g}
                            <i aria-hidden="true"> / </i>
                          </span>
                        );
                      })}
                    </p>
                  ))}
                </div>
              ) : mode === "guide" ? (
                <div className="reading-text guided" style={textStyle}>
                  {reading.paragraphs.map((p, pi) => {
                    const ps = p.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [p];
                    const offset = reading.paragraphs
                      .slice(0, pi)
                      .reduce(
                        (n, p) =>
                          n +
                          (p.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [p]).length,
                        0,
                      );
                    return (
                      <p key={pi}>
                        {ps.map((s, si) => (
                          <span
                            key={si}
                            className={
                              offset + si === position ? "active-sentence" : ""
                            }
                          >
                            {s}{" "}
                          </span>
                        ))}
                      </p>
                    );
                  })}
                </div>
              ) : mode === "skim" && !allText ? (
                <div className="reading-text" style={textStyle}>
                  {reading.paragraphs.map((p, i) => (
                    <p key={i}>
                      {p.match(/^.*?[.!?](?:\s|$)/)?.[0] || p}
                      <span className="fade-lines" aria-hidden="true" />
                    </p>
                  ))}
                  <label className="field">
                    İlk beklentin
                    <textarea
                      value={note}
                      maxLength={3000}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Bu metin sanırım…"
                    />
                  </label>
                  <button
                    className="button primary"
                    disabled={!note.trim()}
                    onClick={() => setAllText(true)}
                  >
                    Bütünü aç, beklentini karşılaştır <ArrowRight size={16} />
                  </button>
                </div>
              ) : mode === "scan" && reading.scan ? (
                <div className="scan-reading">
                  <div className="task-question">
                    <span>ARADIĞIN BİLGİ</span>
                    <h3>{reading.scan.prompt}</h3>
                    <p>Kanıtın geçtiği paragrafı seç. Ardından yanıtını yaz.</p>
                  </div>
                  {reading.paragraphs.map((p, i) => (
                    <button
                      className={`scan-paragraph ${scanParagraph === i ? "selected" : ""}`}
                      key={i}
                      onClick={() => setScanParagraph(i)}
                      style={textStyle}
                    >
                      <span>
                        {i + 1}. paragraf{" "}
                        {scanParagraph === i ? "· Seçildi" : ""}
                      </span>
                      {p}
                    </button>
                  ))}
                  <label className="field">
                    Bulduğun bilgi
                    <input
                      value={scanAnswer}
                      maxLength={200}
                      onChange={(e) => setScanAnswer(e.target.value)}
                    />
                  </label>
                </div>
              ) : (
                text
              )}
            </div>
          )}
          <div className="reading-end">
            <p className="subtle">
              {visual
                ? "Gösterim süresi doğal okuma hızına dönüşmez."
                : "“Bitirdim” seçimi okumanı tamamladığına ilişkin kendi beyanındır."}
            </p>
            <button
              className="button primary"
              disabled={
                mode === "serial"
                  ? position < units.length
                  : mode === "scan"
                    ? scanParagraph === null || !scanAnswer.trim()
                    : mode === "skim"
                      ? !allText
                      : false
              }
              onClick={() =>
                mode === "groups" ? naturalTransfer() : finishReading(true)
              }
            >
              {mode === "groups"
                ? "Şimdi metnin bütününü oku"
                : "Metni bitirdim"}{" "}
              <ArrowRight size={17} />
            </button>
            {!assessment && (
              <details>
                <summary>Şimdilik burada bırak</summary>
                <label className="field">
                  Tamamladığım son paragraf
                  <select
                    value={readParagraph}
                    onChange={(e) => setReadParagraph(+e.target.value)}
                  >
                    <option value={-1}>Henüz bir paragraf tamamlamadım</option>
                    {reading.paragraphs.map((_, i) => (
                      <option key={i} value={i}>
                        {i + 1}. paragraf
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button" onClick={() => finishReading(false)}>
                  Kısmi çalışmayı kaydetmeye geç
                </button>
                <small>Kısmi okumadan hız skoru üretilmez.</small>
              </details>
            )}
          </div>
        </>
      )}
      {stage === "questions" && (
        <div className="question-page">
          <span className="eyebrow">
            {finishedText ? "OKUMA TAMAMLANDI" : "KISMİ ÇALIŞMA"} ·{" "}
            {minutesLabel(seconds.current)} AKTİF SÜRE
          </span>
          <h1>
            {mode === "recall"
              ? "Sayfa kapandı. Fikir sende."
              : mode === "scan"
                ? "Bulduğun bilgiyi bağla."
                : "Metinden sende ne kaldı?"}
          </h1>
          <p className="lead">
            {mode === "meaning"
              ? "Bu açık metin çalışması. Kanıtı inceleyerek cevap verebilirsin."
              : mode === "recall"
                ? "Önce kendi cümlelerinle yaz. Sonra temel fikirlerle karşılaştır."
                : "Soruların süresi okuma süresine eklenmez. Cevaplar ve gerekçeler tüm yanıtlarından sonra açılır."}
          </p>
          {!finishedText ? (
            <div className="notice">
              Yarım metne tam anlama sınavı uygulamıyoruz. Kaldığın yeri ve
              rahatlığını not ederek bitirebilirsin.
            </div>
          ) : mode === "scan" && reading.scan ? (
            <>
              <div className="task-question">
                <h3>{reading.scan.prompt}</h3>
                <p>
                  Yanıtın: <strong>{scanAnswer}</strong>
                </p>
                <p>Seçtiğin kanıt: {scanParagraph! + 1}. paragraf</p>
                <small>
                  Otomatik ölçüm yalnızca doğru kanıt paragrafını seçmeni
                  değerlendirir. Yazılı yanıtın otomatik puanlanmaz.
                </small>
              </div>
            </>
          ) : mode === "recall" || !questions.length ? (
            <>
              <label className="field">
                Kısa özetin · en fazla 5.000 karakter
                <textarea
                  rows={7}
                  value={summary}
                  disabled={showModel}
                  maxLength={5000}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Ana düşünce, önemli bağlantılar ve varsa bir sınır…"
                />
              </label>
              {reading.points.length > 0 ? (
                <>
                  <button
                    className="button"
                    disabled={!summary.trim() || showModel}
                    onClick={() => setShowModel(true)}
                  >
                    Örnek özeti ve fikir listesini aç
                  </button>
                  {showModel && (
                    <div className="model-summary">
                      <span className="eyebrow">
                        ÖZ DEĞERLENDİRME · OTOMATİK ANLAMA PUANI DEĞİL
                      </span>
                      <p>{reading.summary}</p>
                      {reading.points.map((p, i) => (
                        <label className="check-row" key={i}>
                          <input
                            type="checkbox"
                            checked={checked.includes(i)}
                            onChange={() =>
                              setChecked((c) =>
                                c.includes(i)
                                  ? c.filter((x) => x !== i)
                                  : [...c, i],
                              )
                            }
                          />
                          <span>Benim özetimde bu ilişki var: {p}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="notice">
                  Kendi metninde hazır kontrol listesi bulunmuyor. Özetini
                  kaynakla karşılaştır; bu çalışmada anlama ölçümü
                  kullanılamıyor.
                </p>
              )}
            </>
          ) : (
            questions.map((q, i) => (
              <fieldset className="question" key={i}>
                <legend>
                  <span>
                    {String(i + 1).padStart(2, "0")} · {q.skill}
                  </span>
                  {q.prompt}
                </legend>
                <div className="answer-grid">
                  {q.options.map((o, j) => (
                    <label
                      className={`answer ${answers[i] === j ? "selected" : ""}`}
                      key={j}
                    >
                      <input
                        type="radio"
                        name={`q${i}`}
                        checked={answers[i] === j}
                        onChange={() =>
                          setAnswers((a) => {
                            const next = [...a];
                            next[i] = j;
                            return next;
                          })
                        }
                      />
                      <span className="answer-letter">{"ABCD"[j]}</span>
                      {o}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))
          )}
          {finishedText && mode !== "scan" && (
            <>
              <button
                className="text-button"
                onClick={() => {
                  setPeek((x) => !x);
                  if (!peek && mode !== "meaning") {
                    helped.current = true;
                  }
                }}
              >
                <Eye size={16} />{" "}
                {peek
                  ? "Metni kapat"
                  : mode === "meaning"
                    ? "Kanıt için metni aç"
                    : "Metne yeniden bak · yardımlı olarak işaretle"}
              </button>
              {peek && text}
            </>
          )}
          <label className="field">
            Bu çalışma nasıl hissettirdi?
            <select
              value={comfort}
              onChange={(e) => setComfort(e.target.value as Result["comfort"])}
            >
              <option>Rahat</option>
              <option>Dengeli</option>
              <option>Zorlandım</option>
            </select>
          </label>
          <label className="field">
            Bir sonraki okumaya notun
            <textarea
              maxLength={3000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nerede yavaşladın, hangi ilişkiyi daha iyi kurdun?"
            />
          </label>
          <button
            className="button primary"
            disabled={
              finishedText && (mode === "recall" || !questions.length)
                ? !summary.trim()
                : finishedText &&
                  mode !== "scan" &&
                  questions.some((_, i) => answers[i] === undefined)
            }
            onClick={submit}
          >
            Sonucu gör ve kaydet <ArrowRight size={17} />
          </button>
        </div>
      )}
      {stage === "result" && result && (
        <div className="results-page">
          <span className="eyebrow">
            {persisted ? "ÇALIŞMAN KAYDEDİLDİ" : "SONUÇ HAZIR · KAYIT BEKLİYOR"}
          </span>
          <h1>
            {result.score !== null && result.score >= 80
              ? "Anlamın izini korudun."
              : result.complete
                ? "Bir okuma, yeni bir gözlem."
                : "Burada bıraktın. Dönebilirsin."}
          </h1>
          <p className="lead">
            {result.score === null
              ? "Bu çalışmada otomatik anlama puanı yok. Yazdığın not ve varsa öz değerlendirmen ayrı saklanır."
              : result.score >= 80
                ? "Bu metindeki sorularda güçlü bir karşılık verdin. Yeni bir metinde bu ilişkileri yeniden kurmayı dene."
                : "Yanlış yanıtlar tekrarın adresini gösteriyor. Aşağıdaki gerekçelerle bağlantıyı yeniden kur."}
          </p>
          <div className="result-metrics">
            <div>
              <span>{mode === "scan" ? "Kanıt seçimi" : "Anlama"}</span>
              <strong>
                {result.score !== null ? `%${result.score}` : "—"}
              </strong>
              <small>
                {result.answers.length
                  ? `${result.answers.filter((a) => a.correct).length} / ${result.answers.length} doğru`
                  : "Bu modda ölçülmedi"}
              </small>
            </div>
            <div>
              <span>Doğal okuma hızı</span>
              <strong>
                {result.wpm ?? "—"}
                {result.wpm && <em> k/dk</em>}
              </strong>
              <small>
                {result.wpm
                  ? `${result.words} kelime / ${result.seconds.toFixed(1)} sn`
                  : "Bu koşulda hız üretilmedi"}
              </small>
            </div>
            <div>
              <span>Aktif okuma</span>
              <strong>{minutesLabel(result.seconds)}</strong>
              <small>
                Sorular: {minutesLabel(result.questionSeconds)} · ayrı
              </small>
            </div>
            {result.selfRecall !== undefined && (
              <div>
                <span>Öz değerlendirme</span>
                <strong>%{result.selfRecall}</strong>
                <small>Kendi işaretlediğin temel fikirler</small>
              </div>
            )}
          </div>
          <div className="tag-row">
            {[
              modeNames[result.mode],
              result.purpose,
              result.readingId.startsWith("custom")
                ? "Düzeyi belirlenmedi"
                : `Düzey ${result.level}`,
              result.repeated ? "Daha önce görüldü" : "İlk maruziyet",
              result.interrupted ? "Kesintili" : "Kesinti işaretlenmedi",
              result.helped ? "Yardımlı" : "Yardımsız",
              ...(result.settingsChanged ? ["Sunum koşulları değişti"] : []),
              result.complete ? "Tam metin" : "Kısmi çalışma",
            ].map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
          </div>
          <p className="subtle">
            {comparable(result)
              ? "Yeni, doğal ve kesinti işareti olmayan bir gözlem. Benzer düzey ve aynı amaçtaki sonuçlarla birlikte yorumlanabilir."
              : "Bu kayıt karşılaştırılabilir doğal değerlendirmelerden ayrı tutulur."}{" "}
            Tek metin kalıcı beceriyi kanıtlamaz.
          </p>
          {result.tempo && (
            <p className="notice">
              {result.settingsChanged
                ? "Oturumda sunum ayarı değişti. Son gösterim temposu"
                : "Denediğin gösterim temposu"}
              : {result.tempo} k/dk. Bu değer doğal okuma hızına katılmadı.
            </p>
          )}
          {!persisted && (
            <div className="notice" role="status">
              <p>
                Sonuç bu ekranda duruyor; günlüğe yazılamadı (depolama dolu,
                kapalı veya başka sekmede yeni kayıt var).
              </p>
              <button
                className="button primary"
                onClick={() => setSaved(retryPending())}
              >
                Sonucu yeniden kaydet
              </button>
            </div>
          )}
          {finishedText && mode === "scan" && reading.scan ? (
            <div className="feedback">
              <h3>
                {scanParagraph === reading.scan.paragraph
                  ? "✓ Kanıt doğru yerde"
                  : "↺ Kanıtı yeniden incele"}
              </h3>
              <p>
                Metindeki yanıt: <strong>{reading.scan.answer}</strong>
              </p>
              <p>Senin yanıtın: {scanAnswer}</p>
              <blockquote>
                {reading.paragraphs[reading.scan.paragraph]}
              </blockquote>
              <p>
                Yazdığın yanıtın kapsamını kendin karşılaştır; otomatik sonuç
                paragraf seçimini gösterir.
              </p>
            </div>
          ) : finishedText && mode !== "recall" ? (
            questions.map((q, i) => (
              <div
                className={`feedback ${answers[i] === q.answer ? "correct" : "incorrect"}`}
                key={i}
              >
                <span className="eyebrow">
                  {answers[i] === q.answer ? "✓ DOĞRU" : "↺ YENİDEN DÜŞÜN"} ·{" "}
                  {q.skill}
                </span>
                <h3>{q.prompt}</h3>
                <p>Yanıtın: {q.options[answers[i] ?? -1] ?? "Yanıtlanmadı"}</p>
                <p>
                  <strong>Desteklenen yanıt:</strong> {q.options[q.answer]}
                </p>
                <p>{q.why}</p>
                <blockquote>
                  <small>{q.evidence + 1}. paragraftan kanıt</small>
                  {reading.paragraphs[q.evidence]}
                </blockquote>
              </div>
            ))
          ) : null}
          {summary && (
            <div className="model-summary">
              <h3>Senin cümlelerin</h3>
              <p className="preserve">{summary}</p>
            </div>
          )}
          <div className="next-strip">
            <div>
              <span className="eyebrow">BİR SONRAKİ ADIM</span>
              <h3>
                {mode === "guide" || mode === "serial" || mode === "groups"
                  ? "Yeni bir metinde doğal okumaya geç."
                  : result.score !== null && result.score < 60
                    ? "İlgili anlam ilişkisini kitapta yeniden kur."
                    : "Bu fikri yarın metni açmadan hatırla."}
              </h3>
            </div>
            <button
              className="button primary"
              onClick={
                mode === "guide" || mode === "serial" || mode === "groups"
                  ? onTransfer
                  : () =>
                      onLesson(
                        result.score !== null && result.score < 60
                          ? "l08"
                          : lessonId || "l11",
                      )
              }
            >
              {mode === "guide" || mode === "serial" || mode === "groups"
                ? "Yardımsız aktarım"
                : "Kitaba geç"}{" "}
              <ArrowRight size={16} />
            </button>
          </div>
          <button className="text-button" onClick={onExit}>
            <ArrowLeft size={16} /> Çalışma alanına dön
          </button>
        </div>
      )}
      {confirming === "exit" && (
        <Confirm
          title="Çalışmadan çıkılsın mı?"
          body="Bu çalışma tamamlanmış sonuç sayılmayacak. Açılan metin görülmüş olarak kalacak."
          confirmLabel="Çalışmadan çık"
          onClose={() => {
            setConfirming(null);
            if (stage === "reading" || stage === "questions") timer.start();
          }}
          onConfirm={onExit}
        />
      )}
      {confirming === "restart" && (
        <Confirm
          title="Baştan başlansın mı?"
          body="Açık çalışma tamamlanmış sonuç sayılmadan yeni oturuma geçilecek. Metin görülmüş olarak kalacak."
          confirmLabel="Baştan başlat"
          onClose={() => {
            setConfirming(null);
            if (stage === "reading" || stage === "questions") timer.start();
          }}
          onConfirm={doRestart}
        />
      )}
    </div>
  );
}
