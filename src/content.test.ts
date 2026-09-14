import { describe, expect, it } from "vitest";
import { readings } from "./content/readings";
import { lessons } from "./content/lessons";
import { gameInfo } from "./content/games";
import { wordCount } from "./text";

describe("reading library integrity", () => {
  it("holds at least 40 practice texts with six long reads", () => {
    const practice = readings.filter((r) => r.role === "practice");
    expect(practice.length).toBeGreaterThanOrEqual(40);
    const long = readings.filter(
      (r) => r.role === "practice" && r.words >= 700 && r.words <= 1200,
    );
    expect(long.length).toBeGreaterThanOrEqual(6);
  });

  it("keeps stored word counts honest", () => {
    for (const r of readings) {
      expect(r.words).toBe(wordCount(r.paragraphs.join(" ")));
    }
  });

  it("gives every measured text skill-balanced, indexed questions", () => {
    for (const r of readings) {
      expect(r.questions.length).toBeGreaterThan(0);
      for (const [i, q] of r.questions.entries()) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(q.evidence).toBeGreaterThanOrEqual(0);
        expect(q.evidence).toBeLessThan(r.paragraphs.length);
        expect(q.why.trim().length).toBeGreaterThan(0);
        expect(q.prompt.trim().length).toBeGreaterThan(0);
        expect(
          new Set(q.options).size,
          `${r.id} question ${i} has duplicate options`,
        ).toBe(q.options.length);
      }
    }
  });

  it("links every lesson to an existing reading and mode", () => {
    const ids = new Set(readings.map((r) => r.id));
    for (const l of lessons) {
      expect(ids.has(l.reading)).toBe(true);
      const target = readings.find((r) => r.id === l.reading);
      expect(target?.modes).toContain(l.mode);
    }
    expect(lessons).toHaveLength(16);
  });

  it("keeps assessment texts out of practice previews", () => {
    for (const role of ["baseline", "mid", "final"] as const) {
      expect(readings.filter((r) => r.role === role).length).toBeGreaterThan(
        0,
      );
    }
  });

  it("points each game at an existing lesson", () => {
    const lessonIds = new Set(lessons.map((l) => l.id));
    for (const g of gameInfo) {
      expect(lessonIds.has(g.lesson)).toBe(true);
    }
  });
});
