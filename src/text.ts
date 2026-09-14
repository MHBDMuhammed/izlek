export function words(text: string): string[] {
  return (
    text.normalize("NFC").match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) ?? []
  );
}
export const normalize = (s: string) =>
  s.normalize("NFC").toLocaleLowerCase("tr-TR").trim();
export const wordCount = (s: string) => words(s).length;
export const minutesLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
export function validateText(s: string): string {
  const t = s.normalize("NFC").replace(/\r\n?/g, "\n").trim();
  if (!t || wordCount(t) < 10)
    throw Error("En az 10 kelimelik bir metin ekle.");
  if (t.length > 100000)
    throw Error(
      "Metin en fazla 100.000 karakter olabilir. Daha kısa bir bölüm seç.",
    );
  if ([...t].some((ch) => { const c = ch.codePointAt(0) ?? 32; return (c <= 8 || (c >= 14 && c <= 31) || c === 65533); }))
    throw Error(
      "Dosyanın bazı karakterleri okunamıyor. UTF-8 kodlamalı bir .txt dosyası seç.",
    );
  return t;
}
