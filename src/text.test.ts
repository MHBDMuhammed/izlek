import { describe, expect, it } from "vitest";
import { normalize, validateText, wordCount, words } from "./text";

describe("turkish word counting", () => {
  it("counts dotted and dotless I as separate letters", () => {
    expect(words("IĞDIR ili").length).toBe(2);
    expect(normalize("İSTANBUL")).toBe("istanbul");
    expect(normalize("IĞDIR")).toBe("ığdır");
  });

  it("keeps apostrophe and hyphen words whole", () => {
    expect(wordCount("Türk'ün ön-görüşmesi başladı")).toBe(3);
    expect(wordCount("Ankara'ya yarın gidecek")).toBe(3);
  });

  it("documents the decimal-time boundary", () => {
    expect(wordCount("saat 14.30'da buluşalım")).toBe(4);
  });

  it("treats punctuation and extra spacing as separators only", () => {
    expect(wordCount("  merhaba,\tdünya!\n\nnasılsın?  ")).toBe(3);
    expect(wordCount("...")).toBe(0);
  });

  it("normalizes composed and decomposed unicode the same way", () => {
    expect(wordCount("gökyüzü")).toBe(wordCount("go\u0308kyu\u0308zu\u0308"));
  });
});

describe("custom text validation", () => {
  it("rejects short, oversized and unreadable input", () => {
    expect(() => validateText("kısa metin")).toThrow();
    expect(() => validateText(`ok ${"kelime ".repeat(30000)}`)).toThrow();
    expect(() => validateText("okunaklı giriş � devam")).toThrow();
  });

  it("normalizes line endings and trims", () => {
    const out = validateText(
      "birinci kelime grubu burada başlıyor\r\nikinci satır burada devam ediyor ve bitiyor",
    );
    expect(out).not.toContain("\r");
    expect(wordCount(out)).toBeGreaterThanOrEqual(10);
  });
});
