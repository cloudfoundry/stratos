// Upstream error bodies as short, styled plain text.
//
// An error detail can quote a whole HTML page: a proxy's 502, a broker's
// 404, a servlet container's error report. Its words alone read as one run
// of title, heading, message and footer. This module reads such a page
// into a few pieces of text (the heading, the message, some emphasis) that
// callers show with textContent or interpolation, never as HTML.
//
// It does not use the browser's HTML parser: Stratos enforces Trusted Types
// for scripts and has no HTML policy, so innerHTML, DOMParser and the like
// are refused. A page only needs tags and text, which a small tokenizer
// gets in one forward pass. Every search starts where the last one ended
// and a failed search ends the parse, so the time stays linear whatever
// the server sends. Input it cannot read falls back to the tag-stripping
// regex used before.

export type ErrorPieceStyle = 'text' | 'heading' | 'strong' | 'em' | 'code';

export interface ErrorPiece {
  readonly text: string;
  readonly style: ErrorPieceStyle;
}

/** Only the start of a longer body is read; the message is at the top. */
const SCAN_LIMIT = 1024 * 1024;
/** Longest text returned, before the ellipsis. */
const OUTPUT_LIMIT = 1000;
/** Longest page title used when the body has no readable text. */
const TITLE_LIMIT = 200;

// Elements that make text a page rather than a message that happens to
// contain '<': Go's `<nil>`, a comparison, an inline `<i>`.
const PAGE_ELEMENT = /<(?:!doctype|html|head|body|title|h[1-6]|p|br|div|center|pre)[\s/>]/i;

/** True when the text holds an element an HTML page is built from. */
export const looksLikeHtml = (text: string): boolean =>
  PAGE_ELEMENT.test(text.length > SCAN_LIMIT ? text.slice(0, SCAN_LIMIT) : text);

/** The text of all pieces, joined. Line breaks are '\n'. */
export const piecesToText = (pieces: readonly ErrorPiece[]): string =>
  pieces.map(p => p.text).join('');

// The regex this module replaces: keep the words, drop the tags. A tag may
// not contain '<': with only '>' excluded, a run of '<' and no '>'
// backtracks quadratically.
const stripTags = (text: string): string =>
  text.replace(/<[^<>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const BLOCKS = new Set([
  'p', 'div', 'center', 'main', 'section', 'article', 'header', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'li', 'ul', 'ol', 'pre', 'table', 'tr', 'hr', 'blockquote', 'address', 'dl', 'dt', 'dd', 'br',
]);

type Emphasis = Exclude<ErrorPieceStyle, 'text'>;

const EMPHASIS = new Map<string, Emphasis>([
  ['h1', 'heading'], ['h2', 'heading'], ['h3', 'heading'], ['h4', 'heading'], ['h5', 'heading'], ['h6', 'heading'],
  ['strong', 'strong'], ['b', 'strong'],
  ['em', 'em'], ['i', 'em'],
  ['code', 'code'], ['tt', 'code'], ['kbd', 'code'], ['samp', 'code'], ['pre', 'code'],
]);

/** Elements whose content is never shown, counted so nesting closes right. */
const DROPPED = new Set(['noscript', 'template', 'svg']);

/** Elements whose content is raw text up to the matching end tag. */
const RAW_TEXT_END = new Map<string, RegExp>([
  ['script', /<\/script[\s/>]/gi],
  ['style', /<\/style[\s/>]/gi],
  ['title', /<\/title[\s/>]/gi],
]);

const TAG_NAME = /[A-Za-z][A-Za-z0-9-]*/y;

const NAMED_ENTITIES = new Map([
  ['amp', '&'], ['lt', '<'], ['gt', '>'], ['quot', '"'], ['apos', '\''], ['nbsp', ' '],
  ['copy', '©'], ['reg', '®'], ['trade', '™'], ['hellip', '…'], ['mdash', '—'], ['ndash', '–'],
  ['lsquo', '‘'], ['rsquo', '’'], ['ldquo', '“'], ['rdquo', '”'], ['laquo', '«'], ['raquo', '»'],
  ['middot', '·'], ['bull', '•'], ['times', '×'],
]);

// Every alternative is bounded, so each '&' costs a fixed amount of work.
const ENTITY = /&(?:#[xX]([0-9a-fA-F]{1,8})|#([0-9]{1,8})|([A-Za-z][A-Za-z0-9]{1,31}));/g;

const decodeEntities = (s: string): string => s.indexOf('&') < 0 ? s : s.replace(ENTITY,
  (whole: string, hex: string | undefined, dec: string | undefined, name: string | undefined) => {
    if (name !== undefined) {
      return NAMED_ENTITIES.get(name) ?? whole;
    }
    const cp = hex !== undefined ? parseInt(hex, 16) : parseInt(dec ?? '', 10);
    return cp > 0 && cp <= 0x10ffff && (cp < 0xd800 || cp > 0xdfff) ? String.fromCodePoint(cp) : '�';
  });

const collapse = (s: string): string => s.replace(/\s+/g, ' ');

/** The first `n` UTF-16 units of `s`, never ending on half a surrogate pair. */
const sliceUnits = (s: string, n: number): string => {
  const last = s.charCodeAt(n - 1);
  return s.slice(0, last >= 0xd800 && last <= 0xdbff ? n - 1 : n);
};

const capText = (s: string): string =>
  s.length > OUTPUT_LIMIT ? sliceUnits(s, OUTPUT_LIMIT).trimEnd() + '…' : s;

const asPieces = (s: string): ErrorPiece[] => s ? [{ text: s, style: 'text' }] : [];

const isSpace = (c: number): boolean => c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0c || c === 0x0d;

const isAsciiLetter = (c: number): boolean => (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a);

/**
 * Index of the '>' that ends a start tag whose attributes begin at `j`, or
 * -1. A quote opens a value only after '=', as in HTML, and its '>' does not
 * end the tag.
 */
const tagEnd = (s: string, j: number): number => {
  let afterEquals = false;
  for (; j < s.length; j++) {
    const c = s.charCodeAt(j);
    if (c === 0x3e) {
      return j;
    }
    if (afterEquals && (c === 0x22 || c === 0x27)) {
      j = s.indexOf(s[j], j + 1);
      if (j < 0) {
        return -1;
      }
      afterEquals = false;
    } else if (c === 0x3d) {
      afterEquals = true;
    } else if (!isSpace(c)) {
      afterEquals = false;
    }
  }
  return -1;
};

/**
 * Collects readable text into pieces. Whitespace collapses to one space,
 * and a block boundary becomes one '\n', written only once readable text
 * follows it: empty blocks add nothing, and there is never a break at
 * either end.
 */
class PieceWriter {
  readonly pieces: Array<{ text: string; style: ErrorPieceStyle }> = [];
  length = 0;
  private space = false;
  private lineBreak = false;
  private bullet = false;

  breakLine(bullet = false): void {
    this.lineBreak = true;
    this.bullet ||= bullet;
  }

  dropBullet(): void {
    this.bullet = false;
  }

  write(raw: string, style: ErrorPieceStyle): void {
    let s = collapse(decodeEntities(raw));
    if (s.startsWith(' ')) {
      this.space = true;
      s = s.slice(1);
    }
    if (!s) {
      return;
    }
    const trailingSpace = s.endsWith(' ');
    if (trailingSpace) {
      s = s.slice(0, -1);
    }
    let separator = this.length === 0 ? '' : this.lineBreak ? '\n' : this.space ? ' ' : '';
    if (this.bullet) {
      separator += '• ';
    }
    if (separator) {
      this.push(separator, 'text');
    }
    this.push(s, style);
    this.space = trailingSpace;
    this.lineBreak = false;
    this.bullet = false;
  }

  private push(s: string, style: ErrorPieceStyle): void {
    const last = this.pieces[this.pieces.length - 1];
    if (last?.style === style) {
      last.text += s;
    } else {
      this.pieces.push({ text: s, style });
    }
    this.length += s.length;
  }
}

interface Parsed {
  pieces: ErrorPiece[];
  title: string;
}

/** One forward pass over the page; null when a construct never closes. */
const tokenize = (input: string): Parsed | null => {
  const s = input.length > SCAN_LIMIT ? input.slice(0, SCAN_LIMIT) : input;
  const out = new PieceWriter();
  const depth: Record<Emphasis, number> = { heading: 0, strong: 0, em: 0, code: 0 };
  let inHead = 0;
  let dropped = 0;
  let rawTitle: string | undefined;

  const style = (): ErrorPieceStyle =>
    depth.code ? 'code' : depth.heading ? 'heading' : depth.strong ? 'strong' : depth.em ? 'em' : 'text';
  const text = (raw: string): void => {
    if (raw && !inHead && !dropped) {
      out.write(raw, style());
    }
  };
  const open = (name: string, selfClosing: boolean): void => {
    if (name === 'head') {
      inHead++;
    } else if (name === 'body') {
      inHead = 0;
    } else if (DROPPED.has(name) && !selfClosing) {
      dropped++;
    }
    const emphasis = EMPHASIS.get(name);
    if (emphasis && !selfClosing) {
      depth[emphasis]++;
    }
    if (BLOCKS.has(name)) {
      out.breakLine(name === 'li');
    }
  };
  const close = (name: string): void => {
    if (name === 'head') {
      inHead = Math.max(0, inHead - 1);
    } else if (DROPPED.has(name)) {
      dropped = Math.max(0, dropped - 1);
    }
    const emphasis = EMPHASIS.get(name);
    if (emphasis) {
      depth[emphasis] = Math.max(0, depth[emphasis] - 1);
    }
    if (BLOCKS.has(name)) {
      out.breakLine();
    }
    if (name === 'li') {
      out.dropBullet();
    }
  };

  let i = 0;
  while (i < s.length && out.length <= OUTPUT_LIMIT) {
    const lt = s.indexOf('<', i);
    if (lt < 0) {
      text(s.slice(i));
      break;
    }
    text(s.slice(i, lt));
    const next = s.charCodeAt(lt + 1);
    if (s.startsWith('!--', lt + 1)) {
      const end = s.indexOf('-->', lt + 4);
      if (end < 0) {
        return null;
      }
      i = end + 3;
    } else if (next === 0x21 || next === 0x3f) {
      // <!doctype …>, <![CDATA[…]]>, <?xml …?>
      const end = s.indexOf('>', lt + 2);
      if (end < 0) {
        return null;
      }
      i = end + 1;
    } else if (next === 0x2f) {
      const end = s.indexOf('>', lt + 2);
      if (end < 0) {
        return null;
      }
      TAG_NAME.lastIndex = lt + 2;
      const name = TAG_NAME.exec(s)?.[0];
      if (name) {
        close(name.toLowerCase());
      }
      i = end + 1;
    } else if (isAsciiLetter(next)) {
      TAG_NAME.lastIndex = lt + 1;
      const tag = TAG_NAME.exec(s)?.[0] ?? '';
      const name = tag.toLowerCase();
      const end = tagEnd(s, lt + 1 + tag.length);
      if (end < 0) {
        return null;
      }
      i = end + 1;
      const rawTextEnd = RAW_TEXT_END.get(name);
      if (rawTextEnd) {
        rawTextEnd.lastIndex = i;
        const endTag = rawTextEnd.exec(s);
        const gt = endTag ? s.indexOf('>', endTag.index) : -1;
        if (!endTag || gt < 0) {
          return null;
        }
        if (name === 'title' && rawTitle === undefined && !dropped) {
          // Bounded before decoding; trimmed to TITLE_LIMIT after.
          rawTitle = s.slice(i, Math.min(endTag.index, i + 5 * TITLE_LIMIT));
        }
        i = gt + 1;
      } else {
        open(name, s.charCodeAt(end - 1) === 0x2f);
      }
    } else {
      // '<' then a space, digit, '=' …: text, as in HTML.
      text('<');
      i = lt + 1;
    }
  }
  const title = rawTitle === undefined ? '' : collapse(decodeEntities(rawTitle)).trim();
  return { pieces: out.pieces, title: title.length > TITLE_LIMIT ? sliceUnits(title, TITLE_LIMIT) : title };
};

/** Cuts pieces at OUTPUT_LIMIT characters and marks the cut with '…'. */
const capPieces = (pieces: ErrorPiece[]): ErrorPiece[] => {
  const capped: ErrorPiece[] = [];
  let room = OUTPUT_LIMIT;
  for (const piece of pieces) {
    if (piece.text.length <= room) {
      capped.push(piece);
      room -= piece.text.length;
      continue;
    }
    const cut = sliceUnits(piece.text, room).trimEnd();
    if (cut) {
      capped.push({ text: cut + '…', style: piece.style });
    } else {
      capped.push({ text: '…', style: 'text' });
    }
    break;
  }
  return capped;
};

/**
 * Reads an error body into styled pieces of plain text. An HTML page
 * gives its visible text: headings, emphasis and code keep their style;
 * blocks become line breaks; head, script, style, title, noscript,
 * template and svg content and all attributes (so every link target) are
 * dropped; entities are decoded after the tags are read, so `&lt;b&gt;`
 * is the text "<b>". The text is capped at 1,000 characters.
 *
 * Text that is not a page gives what stripping its tags always gave. A
 * page that never closes a construct does too, capped. A page with no
 * readable text gives its title as a heading, if it has one.
 *
 * Never throws.
 */
export const htmlToPieces = (text: string): ErrorPiece[] => {
  if (typeof text !== 'string' || !text) {
    return [];
  }
  if (!looksLikeHtml(text)) {
    return asPieces(stripTags(text));
  }
  let parsed: Parsed | null;
  try {
    parsed = tokenize(text);
  } catch {
    parsed = null;
  }
  if (parsed?.pieces.length) {
    return capPieces(parsed.pieces);
  }
  if (parsed?.title) {
    return [{ text: parsed.title, style: 'heading' }];
  }
  return asPieces(capText(stripTags(text)));
};
