import { describe, expect, it, vi } from "vitest";
import {
  comparable,
  expose,
  fresh,
  lessonDone,
  record,
  recommend,
  resolveTheme,
  validState,
  type Result,
} from "./core";

function result(over: Partial<Result> = {}): Result {
  return {
    id: "r-test-1",
    date: 1000,
    readingId: "r08",
    contentVersion: 1,
    title: "Deneme",
    mode: "natural",
    purpose: "Öğrenmek",
    level: 1,
    words: 200,
    seconds: 60,
    questionSeconds: 20,
    wpm: 200,
    score: 80,
    answers: [],
    interrupted: false,
    repeated: false,
    complete: true,
    comfort: "Dengeli",
    note: "",
    helped: false,
    plannedSeconds: null,
    ...over,
  };
}

describe("measurement boundaries", () => {
  it("counts only clean natural readings as comparable", () => {
    expect(comparable(result())).toBe(true);
    expect(comparable(result({ repeated: true }))).toBe(false);
    expect(comparable(result({ mode: "serial" }))).toBe(false);
    expect(comparable(result({ helped: true }))).toBe(false);
    expect(comparable(result({ interrupted: true }))).toBe(false);
    expect(comparable(result({ seconds: 14 }))).toBe(false);
    expect(comparable(result({ readingId: "custom-x" }))).toBe(false);
    expect(comparable(result({ complete: false }))).toBe(false);
  });

  it("keeps exposure single-counted and retries idempotent", () => {
    const s0 = fresh();
    const r = result();
    const s1 = record(s0, r);
    expect(s1.exposure["r08"]).toBe(1);
    expect(record(s1, r)).toBe(s1);
  });

  it("requires a full lesson triple before lessonDone", () => {
    const s = fresh();
    expect(lessonDone(s, "l01")).toBe(false);
    const partial = {
      ...s,
      readLessons: ["l01"],
      decisions: ["l01"],
    };
    expect(lessonDone(partial, "l01")).toBe(false);
  });

  it("schedules delayed recall only for eligible modes", () => {
    const natural = record(fresh(), result());
    expect(natural.recalls).toHaveLength(1);
    const guided = record(fresh(), result({ id: "g", mode: "guide" }));
    expect(guided.recalls).toHaveLength(0);
  });
});

describe("recommendation branches", () => {
  it("starts with baseline, then next lesson", () => {
    const first = recommend(fresh());
    expect(first.assessment).toBe("baseline");
  });

  it("suggests a fresh start after a long gap without pushing records", () => {
    const s = {
      ...fresh(),
      lastVisit: Date.now() - 8 * 86400000,
      results: [
        { ...result(), assessment: "baseline" as const, complete: true },
      ],
    };
    const rec = recommend(s);
    expect(rec.readingId).toBe("r31");
  });

  it("routes repeated low recall to the summary lesson", () => {
    const s = {
      ...fresh(),
      results: [
        { ...result(), assessment: "baseline" as const, complete: true },
      ],
      recalls: [
        {
          id: "a",
          readingId: "r08",
          resultId: "x",
          due: 1,
          done: 2,
          draft: "d",
          selfScore: 40,
        },
        {
          id: "b",
          readingId: "r09",
          resultId: "y",
          due: 1,
          done: 3,
          draft: "d",
          selfScore: 30,
        },
      ],
    };
    expect(recommend(s).lessonId).toBe("l11");
  });

  it("lowers tempo pressure when speed rises and meaning falls", () => {
    const mk = (wpm: number, score: number, id: string) =>
      result({ wpm, score, id, readingId: id });
    const s = {
      ...fresh(),
      results: [
        { ...result(), assessment: "baseline" as const, complete: true },
        mk(150, 90, "a"),
        mk(155, 88, "b"),
        mk(200, 70, "c"),
        mk(210, 65, "d"),
      ],
    };
    const rec = recommend(s);
    expect(rec.lessonId).toBe("l10");
    expect(rec.tempo).toBeLessThan(180);
  });

  it("does not demote on a single weak signal", () => {
    vi.useFakeTimers();
    try {
      const s = {
        ...fresh(),
        results: [
          { ...result(), assessment: "baseline" as const, complete: true },
          result({ id: "weak", score: 20, readingId: "r09" }),
        ],
      };
      const rec = recommend(s);
      expect(rec.lessonId).not.toBe("l10");
    } finally {
      vi.useRealTimers();
    }
  });
});
describe("local state validation", () => {
  it("rejects corrupt payloads without throwing", () => {
    expect(validState(null)).toBe(false);
    expect(validState({ version: 2 })).toBe(false);
    expect(validState({ ...fresh(), profile: { ...fresh().profile, daily: 99 } })).toBe(
      false,
    );
  });

  it("accepts the system theme and resolves it against the OS", () => {
    expect(
      validState({ ...fresh(), prefs: { ...fresh().prefs, theme: "system" } }),
    ).toBe(true);
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
    expect(["light", "dark"]).toContain(resolveTheme("system"));
  });

  it("caps exposure growth for custom texts", () => {
    let s = fresh();
    for (let i = 0; i < 60; i++) s = expose(s, `custom-${i}`);
    expect(
      Object.keys(s.exposure).filter((k) => k.startsWith("custom")).length,
    ).toBeLessThanOrEqual(50);
  });
});
