import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCcw,
  Link,
  Search,
  Route,
  Brain,
  Volume2,
  VolumeX,
} from "lucide-react";
import { type Store } from "../core";
import {
  gameInfo,
  sequences,
  evidenceCases,
  linkRounds,
  memoryRounds,
} from "../content/games";
function shuffle<T>(a: T[]) {
  const copy = [...a];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a === undefined || b === undefined) continue;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}
function tone(on: boolean) {
  if (!on) return;
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 550;
    gain.gain.setValueAtTime(0.055, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.17);
    oscillator.onended = () => void ctx.close();
  } catch {
    /* Sound is optional; visual feedback remains available. */
  }
}
const icons = [Route, Search, Link, Brain] as const;
export default function Games({
  store,
  onLesson,
  initialGame,
}: {
  store: Store;
  onLesson: (id: string) => void;
  initialGame?: string;
}) {
  const [game, setGame] = useState<string | null>(
    initialGame && gameInfo.some((g) => g.id === initialGame)
      ? initialGame
      : null,
  );
  const [run, setRun] = useState(0);
  return (
    <>
      {game ? (
        <Game
          key={`${game}-${run}`}
          game={game}
          store={store}
          onExit={() => setGame(null)}
          onReplay={() => setRun((x) => x + 1)}
          onLesson={onLesson}
        />
      ) : (
        <>
          <div className="page-heading">
            <span className="eyebrow">KISA OYUNLAR, GERÇEK İLİŞKİLER</span>
            <h1>
              Biraz oyun.
              <br />
              <em>Biraz daha anlam.</em>
            </h1>
            <p>
              Hız yarışı yok. Düşünceyi bul, hikâyeyi kur, bağlantıyı hatırla.
            </p>
          </div>
          <div className="games-grid">
            {gameInfo.map((g, i) => {
              const Icon = icons[i % icons.length] ?? Route;
              const past = store.state.games.filter((x) => x.game === g.id);
              return (
                <article className={`game-cover game-${i}`} key={g.id}>
                  <div className="game-art" aria-hidden="true">
                    <Icon size={64} strokeWidth={1} />
                    <div className="game-symbols">
                      {i === 0
                        ? "01 ─ 03 ─ 02"
                        : i === 1
                          ? "“ ” → ✓"
                          : i === 2
                            ? "neden ⤳ sonuç"
                            : "fikir ↔ iz"}
                    </div>
                  </div>
                  <div className="game-cover-body">
                    <span className="eyebrow">{g.skill} · 3 TUR</span>
                    <h2>{g.title}</h2>
                    <p>{g.subtitle}</p>
                    <p className="subtle">
                      {past.length
                        ? `${past.length} oyun tamamlandı · Son doğruluk %${past.at(-1)!.score}`
                        : "İlk oyunun için hazır."}
                    </p>
                    <button className="button" onClick={() => setGame(g.id)}>
                      Oyuna gir <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="notice">
            Oyun doğruluğu ayrı kaydedilir. Bu sonuçlar doğal okuma hızının ya
            da genel anlama düzeyinin yerine geçmez.
          </p>
        </>
      )}
    </>
  );
}
function Game({
  game,
  store,
  onExit,
  onReplay,
  onLesson,
}: {
  game: string;
  store: Store;
  onExit: () => void;
  onReplay: () => void;
  onLesson: (id: string) => void;
}) {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [order, setOrder] = useState(() => shuffle([0, 1, 2]));
  const [selected, setSelected] = useState<number[]>([]);
  const [left, setLeft] = useState<number | null>(null);
  const [links, setLinks] = useState<number[]>([]);
  const [rightOrder, setRightOrder] = useState(() => shuffle([0, 1, 2]));
  const [memory, setMemory] = useState(() =>
    shuffle(Array.from({ length: 6 }, (_, i) => i)),
  );
  const [flips, setFlips] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [studying, setStudying] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [won, setWon] = useState(false);
  const [done, setDone] = useState(false);
  const [moves, setMoves] = useState(0);
  const [errors, setErrors] = useState(0);
  const [saved, setSaved] = useState(false);
  const [score, setScore] = useState(0);
  const [savedId, setSavedId] = useState<string | null>(null);
  const finalRecord = useRef<{
    id: string;
    game: string;
    date: number;
    score: number;
    moves: number;
  } | null>(null);
  const lock = useRef(false);
  const info = gameInfo.find((g) => g.id === game) ?? gameInfo[0];
  const sequence = sequences[round];
  const evidence = evidenceCases[round];
  const linkRound = linkRounds[round];
  const pairs = linkRound?.pairs ?? [];
  const memoryPairs = memoryRounds[round];
  if (!info || !sequence || !evidence || !linkRound || !memoryPairs)
    return null;
  const persisted =
    saved &&
    !store.conflict &&
    store.state.games.some((g) => g.id === (savedId ?? ""));
  function success(msg: string) {
    setFeedback(msg);
    setWon(true);
    tone(store.state.prefs.sound);
  }
  const sequenceWhy = sequence.why;
  function checkSequence() {
    if (won || lock.current) return;
    setMoves((x) => x + 1);
    if (order.every((x, i) => x === i)) success(sequenceWhy);
    else {
      setErrors((x) => x + 1);
      setFeedback(`Sıra henüz tamamlanmadı. ${sequenceWhy}`);
    }
  }
  const evidenceAnswers = evidence.answers;
  const evidenceWhy = evidence.why;
  function checkEvidence() {
    if (won || selected.length !== 2) return;
    setMoves((x) => x + 1);
    if (evidenceAnswers.every((x) => selected.includes(x)))
      success(evidenceWhy);
    else {
      setErrors((x) => x + 1);
      setFeedback(`Bir bağlantı eksik. ${evidenceWhy}`);
    }
  }
  function connect(target: number) {
    if (left === null || won || links.includes(target)) return;
    setMoves((x) => x + 1);
    if (left === target) {
      const next = [...links, left];
      setLinks(next);
      setFeedback("✓ Bu durum ve sonuç birbirine bağlandı.");
      tone(store.state.prefs.sound);
      if (next.length === pairs.length)
        success(
          "Bütün köprüler yerinde. İlişkinin iki tarafını birlikte hatırladın.",
        );
    } else {
      setErrors((x) => x + 1);
      setFeedback(
        "↺ Bu sonuç seçtiğin durumdan doğmuyor. Önce kaynak cümlenin ne anlattığını düşün.",
      );
    }
    setLeft(null);
  }
  function flip(card: number) {
    if (
      studying ||
      flips.length >= 2 ||
      matched.includes(Math.floor(card / 2)) ||
      flips.includes(card) ||
      won
    )
      return;
    const next = [...flips, card];
    setFlips(next);
    if (next.length === 2) {
      setMoves((x) => x + 1);
      const first = next[0] ?? -2;
      const second = next[1] ?? -1;
      const match = Math.floor(first / 2) === Math.floor(second / 2);
      if (match) {
        const m = [...matched, Math.floor(card / 2)];
        setMatched(m);
        setFlips([]);
        tone(store.state.prefs.sound);
        setFeedback("✓ Kavram ve işlev aynı köprüde.");
        if (memoryPairs && m.length === memoryPairs.length)
          success(
            "Bütün çiftler tamamlandı. Aynı kelimeyi değil, ona ait işlevi eşleştirdin.",
          );
      } else {
        setErrors((x) => x + 1);
        setFeedback(
          "↺ İki kart farklı ilişkilere ait. İncele, sonra kartları kapatıp yeniden dene.",
        );
      }
    }
  }
  function next() {
    if (lock.current) return;
    lock.current = true;
    if (round === 2) {
      const correct = game === "sequence" || game === "evidence" ? 3 : 12;
      const value = Math.round((correct / (correct + errors)) * 100);
      setScore(value);
      const g = { id: crypto.randomUUID(), game, date: Date.now(), score: value, moves };
      finalRecord.current = g;
      setSavedId(g.id);
      setSaved(
        store.update((s) => ({
          ...s,
          games: s.games.some((x) => x.id === g.id)
            ? s.games
            : [...s.games, g].slice(-80),
          lastVisit: Date.now(),
        })),
      );
      setDone(true);
    } else {
      const r = round + 1;
      setRound(r);
      const nextSequence = sequences[r];
      if (nextSequence) setOrder(shuffle(nextSequence.cards.map((_, i) => i)));
      setSelected([]);
      setLeft(null);
      setLinks([]);
      const nextLinks = linkRounds[r];
      if (nextLinks) setRightOrder(shuffle(nextLinks.pairs.map((_, i) => i)));
      const nextMemory = memoryRounds[r];
      if (nextMemory)
        setMemory(
          shuffle(Array.from({ length: nextMemory.length * 2 }, (_, i) => i)),
        );
      setFlips([]);
      setMatched([]);
      setStudying(true);
      setFeedback("");
      setWon(false);
    }
    lock.current = false;
  }
  return (
    <div className="game-page">
      <div className="workspace-head">
        <button className="text-button" onClick={onExit}>
          <ArrowLeft size={16} /> Oyunlar
        </button>
        <span className="eyebrow">{info.skill}</span>
        <button
          className="icon-button"
          aria-label={store.state.prefs.sound ? "Sesi kapat" : "Sesi aç"}
          onClick={() =>
            store.update((s) => ({
              ...s,
              prefs: { ...s.prefs, sound: !s.prefs.sound },
            }))
          }
        >
          {store.state.prefs.sound ? (
            <Volume2 size={19} />
          ) : (
            <VolumeX size={19} />
          )}
        </button>
      </div>
      <div className="game-heading">
        <span className="eyebrow">
          {done
            ? "OYUN TAMAMLANDI"
            : started
              ? `TUR ${round + 1} / 3`
              : "ANLAMLA OYNA"}
        </span>
        <h1>{info.title}</h1>
        <p>
          {started && !done
            ? ["İlk bağlantılar", "Bir adım daha derine", "Bütününü kur"][round]
            : info.subtitle}
        </p>
      </div>
      {!started ? (
        <div className="game-intro">
          <div className="rule-illustration" aria-hidden="true">
            {game === "sequence"
              ? "③ → ① → ②"
              : game === "evidence"
                ? "ipucu + ipucu = çıkarım"
                : game === "links"
                  ? "neden ━━━━━ sonuç"
                  : "fikir ↔ anlam"}
          </div>
          <h2>Nasıl oynanır?</h2>
          <p>{info.description}</p>
          <p>
            Hız bonusu yok. Yanlış eşleşme doğruluğu düşürür; açıklamayı
            kullanıp yeniden deneyebilirsin. Dokunma, fare veya Tab ve Enter ile
            bütün kontroller kullanılabilir.
          </p>
          <button className="button primary" onClick={() => setStarted(true)}>
            Hazırım, başlayalım <ArrowRight size={16} />
          </button>
          <button className="text-button" onClick={() => onLesson(info.lesson)}>
            Önce ilgili dersi oku
          </button>
        </div>
      ) : done ? (
        <div className="game-finish">
          <span className="finish-emblem">
            <Check size={40} />
          </span>
          <h2>Bağlantılar tamam.</h2>
          <div className="result-metrics">
            <div>
              <span>Oyun doğruluğu</span>
              <strong>%{score}</strong>
              <small>Doğru eşleşme / tüm denemeler</small>
            </div>
            <div>
              <span>Deneme</span>
              <strong>{moves}</strong>
              <small>{errors} düzeltme fırsatı</small>
            </div>
            <div>
              <span>Tamamlanan tur</span>
              <strong>3</strong>
              <small>Artan parça sayısı</small>
            </div>
          </div>
          <p>
            {persisted
              ? "Oyun günlüğüne kaydedildi."
              : "Kayıt tamamlanmadı; tekrar deneyebilirsin."}{" "}
            Bu puan doğal okuma değerlendirmelerine eklenmez.
          </p>
          {!persisted && (
            <button
              className="button"
              onClick={() => {
                const g = finalRecord.current;
                if (!g) return;
                setSavedId(g.id);
                setSaved(
                  store.update((s) => ({
                    ...s,
                    games: s.games.some((x) => x.id === g.id)
                      ? s.games
                      : [...s.games, g].slice(-80),
                  })),
                );
              }}
            >
              Kaydı yeniden dene
            </button>
          )}
          <div className="actions">
            <button
              className="button primary"
              onClick={() => onLesson(info.lesson)}
            >
              Beceriyi yeni okumaya taşı <ArrowRight size={16} />
            </button>
            <button className="button" onClick={onReplay}>
              <RotateCcw size={16} /> Yeniden oyna
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="round-progress"
            aria-label={`Üç turun ${round + 1}. turu`}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className={i <= round ? "filled" : ""} />
            ))}
          </div>
          <div className="game-board">
            {game === "sequence" && (
              <>
                <h2>{sequence.title}</h2>
                <p>
                  Başlangıcı üste, sonucu alta taşı. Kartların sırasını ok
                  tuşlarıyla değiştir.
                </p>
                <div className="sequence-stack">
                  {order.map((item, index) => (
                    <div className="sequence-card" key={item}>
                      <span>{index + 1}</span>
                      <p>{sequence.cards[item] ?? ""}</p>
                      <div>
                        <button
                          aria-label={`${index + 1}. kartı yukarı taşı`}
                          disabled={index === 0 || won}
                          onClick={() =>
                            setOrder((a) => {
                              const b = [...a];
                              const upper = b[index - 1] ?? b[index];
                              const lower = b[index] ?? b[index - 1];
                              if (upper === undefined || lower === undefined)
                                return b;
                              b[index - 1] = upper;
                              b[index] = lower;
                              return b;
                            })
                          }
                        >
                          <ArrowUp size={17} />
                        </button>
                        <button
                          aria-label={`${index + 1}. kartı aşağı taşı`}
                          disabled={index === order.length - 1 || won}
                          onClick={() =>
                            setOrder((a) => {
                              const b = [...a];
                              const lower2 = b[index + 1] ?? b[index];
                              const upper2 = b[index] ?? b[index + 1];
                              if (lower2 === undefined || upper2 === undefined)
                                return b;
                              b[index + 1] = lower2;
                              b[index] = upper2;
                              return b;
                            })
                          }
                        >
                          <ArrowDown size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="button primary"
                  disabled={won}
                  onClick={checkSequence}
                >
                  Anlatıyı birleştir <Route size={16} />
                </button>
              </>
            )}
            {game === "evidence" && (
              <>
                <div className="claim">
                  <span className="eyebrow">DESTEKLENECEK ÇIKARIM</span>
                  <h2>{evidence.claim}</h2>
                </div>
                <p>
                  Bu çıkarımı birlikte destekleyen <strong>iki</strong> kanıt
                  şeridini seç. {selected.length}/2 seçildi.
                </p>
                <div className="evidence-strips">
                  {evidence.clues.map((clue, i) => (
                    <button
                      className={selected.includes(i) ? "selected" : ""}
                      disabled={won}
                      key={i}
                      onClick={() =>
                        setSelected((s) =>
                          s.includes(i)
                            ? s.filter((x) => x !== i)
                            : s.length < 2
                              ? [...s, i]
                              : s,
                        )
                      }
                    >
                      <span>
                        {selected.includes(i)
                          ? "✓"
                          : String(i + 1).padStart(2, "0")}
                      </span>
                      {clue}
                    </button>
                  ))}
                </div>
                <button
                  className="button primary"
                  disabled={selected.length !== 2 || won}
                  onClick={checkEvidence}
                >
                  Kanıt dosyasını tamamla <Search size={16} />
                </button>
              </>
            )}
            {game === "links" && (
              <>
                <h2>{linkRound.title}</h2>
                <p>
                  Önce solda bir durum, sonra sağda onun sonucunu seç.{" "}
                  {links.length}/{pairs.length} köprü kuruldu.
                </p>
                <div className="link-board">
                  <div>
                    <span className="eyebrow">DURUM / KAYNAK</span>
                    {pairs.map((p, i) => (
                      <button
                        key={i}
                        disabled={links.includes(i) || won}
                        className={`${left === i ? "selected" : ""} ${links.includes(i) ? "linked" : ""}`}
                        onClick={() => setLeft(i)}
                      >
                        {links.includes(i) ? "✓ " : ""}
                        {p[0]}
                      </button>
                    ))}
                  </div>
                  <div className="bridge-space" aria-hidden="true">
                    ↔
                  </div>
                  <div>
                    <span className="eyebrow">SONUÇ / İŞLEV</span>
                    {rightOrder.map((i) => (
                      <button
                        key={i}
                        disabled={links.includes(i) || won || left === null}
                        className={links.includes(i) ? "linked" : ""}
                        onClick={() => connect(i)}
                      >
                        {links.includes(i) ? "✓ " : ""}
                        {pairs[i]?.[1] ?? ""}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {game === "memory" && (
              <>
                <h2>
                  {studying
                    ? "Önce ilişkileri incele."
                    : "Hangi fikir, hangi işleve aitti?"}
                </h2>
                {studying ? (
                  <>
                    <div className="study-pairs">
                      {memoryPairs.map((p, i) => (
                        <div key={i}>
                          <strong>{p[0]}</strong>
                          <ArrowRight size={18} />
                          <span>{p[1]}</span>
                        </div>
                      ))}
                    </div>
                    <p>
                      Hazır olduğunda kartları kapat. Ezber için zorunlu bir
                      süre yok.
                    </p>
                    <button
                      className="button primary"
                      onClick={() => setStudying(false)}
                    >
                      Kartları kapat, hatırlamaya başla
                    </button>
                  </>
                ) : (
                  <>
                    <div className="memory-grid">
                      {memory.map((card, index) => {
                        const open =
                          flips.includes(card) ||
                          matched.includes(Math.floor(card / 2));
                        return (
                          <button
                            key={card}
                            aria-label={
                              open
                                ? (memoryPairs[Math.floor(card / 2)]?.[
                                    card % 2
                                  ] ?? `${index + 1}. kart`)
                                : `${index + 1}. kapalı kartı aç`
                            }
                            disabled={
                              matched.includes(Math.floor(card / 2)) || won
                            }
                            className={`${open ? "open" : ""} ${matched.includes(Math.floor(card / 2)) ? "matched" : ""}`}
                            onClick={() => flip(card)}
                          >
                            {open ? (
                              <>
                                <span className="eyebrow">
                                  {card % 2 ? "İŞLEV" : "KAVRAM"}
                                </span>
                                {memoryPairs[Math.floor(card / 2)]?.[card % 2] ?? ""}
                              </>
                            ) : (
                              <span aria-hidden="true">
                                i<span className="memory-dot">·</span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {flips.length === 2 && (
                      <button
                        className="button"
                        onClick={() => {
                          setFlips([]);
                          setFeedback("");
                        }}
                      >
                        Bu iki kartı kapat
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          {feedback && (
            <div
              className={`game-feedback ${won ? "success" : ""}`}
              role="status"
            >
              <strong>{won ? "✓ Bağ kuruldu." : "Birlikte düşünelim."}</strong>
              <p>{feedback}</p>
              {won && (
                <button className="button primary" onClick={next}>
                  {round === 2 ? "Oyun sonucunu gör" : "Sonraki tur"}{" "}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
