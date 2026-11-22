import { MAX_ANSWER_LENGTH } from "./scoring";

const INVISIBLE = /[\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;
const APOSTROPHES = /[\u2018\u2019\u201B\u2032\u02BC\u0060\u00B4]/g;
const QUOTES = /[\u201C\u201D\u201E\u201F\u2033]/g;
const DASHES = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g;

/**
 * Answer normalization contract (docs/02_GAME_RULES.md):
 * NFKC, invisible-character removal, punctuation variants, whitespace collapse, case folding.
 * Diacritics are deliberately NOT stripped: transliterations must be editorially approved aliases.
 */
export function normalizeAnswer(input: string): string {
  return input
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(APOSTROPHES, "'")
    .replace(QUOTES, '"')
    .replace(DASHES, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ς/g, "σ")
    .normalize("NFKC");
}

/** Counts Unicode code points rather than UTF-16 units. */
export function answerLength(input: string): number {
  return [...input].length;
}

export function isAnswerWithinLimit(input: string): boolean {
  return answerLength(input) <= MAX_ANSWER_LENGTH;
}
