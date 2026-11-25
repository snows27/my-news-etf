// Repairs a known Thai-output glitch: the model sometimes swaps the first letter of an
// English proper noun for a Thai character ("Jensen" → "จensen", "Huang" → "หuang").
//
// The pattern is a single Thai character directly followed by a Latin run that starts
// with a lowercase letter. We only fix it when the source articles contain exactly one
// word that matches (same length, same tail), so normal Thai/English mixing such as
// "หุ้นNVDA" or "เป็นCEO" is never touched.

const MIXED_WORD = /([฀-๿])([a-z][A-Za-z'-]*)/g;

function buildVocabulary(sourceTexts: string[]): Set<string> {
  const words = new Set<string>();
  for (const text of sourceTexts) {
    for (const w of text.match(/[A-Za-z][A-Za-z'-]+/g) ?? []) words.add(w);
  }
  return words;
}

function repairString(text: string, vocab: Set<string>, fixes: string[]): string {
  return text.replace(MIXED_WORD, (match, _thai: string, latin: string) => {
    const candidates = [...vocab].filter((w) => w.length === latin.length + 1 && w.slice(1) === latin);
    if (candidates.length !== 1) return match;
    fixes.push(`${match} → ${candidates[0]}`);
    return candidates[0];
  });
}

function repairValue(value: unknown, vocab: Set<string>, fixes: string[]): unknown {
  if (typeof value === 'string') return repairString(value, vocab, fixes);
  if (Array.isArray(value)) return value.map((v) => repairValue(v, vocab, fixes));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, repairValue(v, vocab, fixes)])
    );
  }
  return value;
}

/** Returns a copy of `data` with broken English words restored from the source texts. */
export function repairMixedScriptWords<T>(data: T, sourceTexts: string[]): { data: T; fixes: string[] } {
  const fixes: string[] = [];
  const repaired = repairValue(data, buildVocabulary(sourceTexts), fixes) as T;
  return { data: repaired, fixes };
}
