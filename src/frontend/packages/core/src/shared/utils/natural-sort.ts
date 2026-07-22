/**
 * Natural string comparison with first-class numeric awareness.
 *
 * Tokenizes each input on runs of digits — `app-23-prod` becomes the
 * sequence [text:"app-", num:23, text:"-prod"] — then streams the two
 * token sequences in lock-step. Numeric tokens compare numerically
 * (so "org_2" < "org_10"), text tokens compare via an Intl.Collator
 * with locale-aware sensitivity.
 *
 * Behaviour parameters:
 *   caseSensitive  false (default) — sensitivity: 'base'  (a ≡ A ≡ ä)
 *                  true            — sensitivity: 'variant' (locale-aware
 *                                    case- and accent-distinguishing)
 *   direction      'asc' (default) or 'desc'. Baked into the return
 *                  value — DO NOT multiply the result by your own
 *                  direction sign. The direction matters for the
 *                  missing-token decision below.
 *   ctx            optional collection-aware tokenizer hint, produced
 *                  by detectSortContext over the array being sorted.
 *
 * Missing-token decision table (when one side runs out of tokens or
 * has nothing where the other has a number):
 *
 *                MatchCase ON       MatchCase OFF
 *     ASC        smallest (-∞)      empty (lex continuation)
 *     DESC       largest  (+∞)      empty (lex continuation)
 *
 * Effect: with MatchCase ON the bare-prefix entity is *pinned* to the
 * head of its numeric siblings regardless of direction (smallest in
 * ASC, largest in DESC — both put it first visually). With MatchCase
 * OFF we just do lex-continuation: shorter wins in ASC, loses in DESC.
 *
 * --- Collection-aware tokenization (stripSeparators) -----------------
 *
 * The pairwise comparator can't see the rest of the collection, so the
 * heuristic that decides whether `Org 4`, `Org_5`, and `Org6` ought to
 * sequence together by their numeric token (vs being held apart by
 * their separator characters) lives in detectSortContext below. The
 * output is fed into naturalCompare via the `ctx` parameter:
 *
 *   - ctx.stripSeparators === true:  whitespace/_/- are stripped from
 *     each value before tokenizing, collapsing every input to the
 *     alternating xxx-nnn form. Lossy: `Org` and `Org_` compare equal.
 *   - ctx.stripSeparators omitted/false: tokenize as-is — separators
 *     remain part of the surrounding text tokens (legacy behaviour).
 *
 * The flag is set when at least NO_SEPARATOR_PATTERN_THRESHOLD of the
 * non-empty values exhibit a "letter, optional separator chars, digit"
 * (or mirror) form. The threshold treats the strip as opt-in for
 * collections that are mostly in the xxx-nnn family — when only a few
 * outliers carry digits, we leave them as opaque text instead.
 */

const baseCollator = new Intl.Collator(undefined, { sensitivity: 'base' });
const variantCollator = new Intl.Collator(undefined, { sensitivity: 'variant' });

/**
 * Fraction of values that must exhibit the `letter–separator?–digit`
 * pattern before detectSortContext flips stripSeparators on. Set at
 * 0.3 deliberately on the low end — once roughly a third of a list
 * looks like the xxx-nnn family, the pattern is meaningful enough that
 * grouping outliers with it reads as the right answer. Tune up if it
 * becomes too aggressive in practice.
 */
export const NO_SEPARATOR_PATTERN_THRESHOLD = 0.3;

/**
 * Back-compat export: the original case-insensitive numeric-aware
 * Intl.Collator instance. `local-filtering-sorting.ts` still imports
 * it directly. New code should prefer `naturalCompare`.
 */
export const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export interface NaturalSortContext {
  /**
   * Strip whitespace, underscore, and hyphen from each value before
   * tokenizing. Causes `Org_5`, `Org 5`, `Org-5`, and `Org5` to all
   * tokenize as [text:"Org", num:5] and sequence together by number.
   * Set by detectSortContext when the collection is predominantly in
   * the xxx-separator?-nnn family.
   */
  stripSeparators?: boolean;
}

interface TextToken { text: string; num?: undefined; }
interface NumToken  { text?: undefined; num: number; }
type Token = TextToken | NumToken;

const SEPARATOR_CHAR_CLASS = /[\s_-]/g;
// Pattern that flags an entry as part of the xxx-sep?-nnn family. Both
// directions covered (letter→digit and digit→letter), separator class
// matches zero or more of [whitespace _ -].
const XXX_NNN_FAMILY = /[A-Za-z][\s_-]*\d|\d[\s_-]*[A-Za-z]/;

/**
 * Analyze a collection of strings to decide which tokenization hints
 * to apply when sorting them. The result is passed via `ctx` into
 * subsequent naturalCompare calls.
 */
export function detectSortContext(values: readonly string[]): NaturalSortContext {
  let totalNonEmpty = 0;
  let matched = 0;
  for (const v of values) {
    if (!v) continue;
    totalNonEmpty++;
    if (XXX_NNN_FAMILY.test(v)) matched++;
  }
  return {
    stripSeparators: totalNonEmpty > 0
      && matched / totalNonEmpty >= NO_SEPARATOR_PATTERN_THRESHOLD,
  };
}

function tokenize(value: string, ctx: NaturalSortContext): Token[] {
  if (!value) return [];
  const cleaned = ctx.stripSeparators ? value.replace(SEPARATOR_CHAR_CLASS, '') : value;
  if (!cleaned) return [];
  const tokens: Token[] = [];
  const re = /(\d+)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(cleaned)) !== null) {
    if (match.index > lastIdx) {
      tokens.push({ text: cleaned.slice(lastIdx, match.index) });
    }
    tokens.push({ num: Number(match[1]) });
    lastIdx = match.index + match[1].length;
  }
  if (lastIdx < cleaned.length) tokens.push({ text: cleaned.slice(lastIdx) });
  return tokens;
}

export function naturalCompare(
  a: string,
  b: string,
  caseSensitive = false,
  direction: 'asc' | 'desc' = 'asc',
  ctx: NaturalSortContext = {},
): number {
  const sign = direction === 'asc' ? 1 : -1;
  const ta = tokenize(a ?? '', ctx);
  const tb = tokenize(b ?? '', ctx);
  const collator = caseSensitive ? variantCollator : baseCollator;
  const len = Math.max(ta.length, tb.length);

  for (let i = 0; i < len; i++) {
    const tokA = ta[i] as Token | undefined;
    const tokB = tb[i] as Token | undefined;

    if (!tokA && !tokB) return 0;
    if (!tokA) return caseSensitive ? -1 : -1 * sign;
    if (!tokB) return caseSensitive ?  1 :  1 * sign;

    if (tokA.num !== undefined && tokB.num !== undefined) {
      const d = tokA.num - tokB.num;
      if (d !== 0) return d * sign;
      continue;
    }
    if (tokA.text !== undefined && tokB.text !== undefined) {
      const d = collator.compare(tokA.text, tokB.text);
      if (d !== 0) return d * sign;
      continue;
    }
    // Mixed types — numeric tokens sort before text tokens (digits
    // before letters under nearly all collations; matches the lex
    // intuition that "3" < "abc").
    return (tokA.num !== undefined ? -1 : 1) * sign;
  }
  return 0;
}
