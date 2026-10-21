import { describe, expect, it } from 'vitest';
import { ErrorPiece, htmlToPieces, looksLikeHtml, piecesToText } from './upstream-error-text';

const text = (html: string): string => piecesToText(htmlToPieces(html));
const t = (s: string): ErrorPiece => ({ text: s, style: 'text' });
const h = (s: string): ErrorPiece => ({ text: s, style: 'heading' });
const b = (s: string): ErrorPiece => ({ text: s, style: 'strong' });
const em = (s: string): ErrorPiece => ({ text: s, style: 'em' });
const code = (s: string): ErrorPiece => ({ text: s, style: 'code' });

// What the tag-stripping regex this module replaces gave for the same input.
const legacy = (s: string): string => s.replace(/<[^<>]+>/g, ' ').replace(/\s+/g, ' ').trim();

describe('looksLikeHtml', () => {
  it('recognises the elements an error page is built from', () => {
    for (const s of ['<!DOCTYPE html>', '<HTML>', '<head>', '<body class="x">', '<title>', '<h1>', '<H6 id=a>',
      '<p>', '<br/>', '<br>', '<div\n>', '<center>', '<pre>']) {
      expect(looksLikeHtml(`before ${s} after`), s).toBe(true);
    }
  });

  it('leaves Go nil values, comparisons and inline-only markup alone', () => {
    for (const s of ['<nil>', 'map[name:<nil>]', 'a < b', 'a<b and c>d', '<i>x</i>', '<prefix>', '<body-part>',
      '<param>', '<html5>', '']) {
      expect(looksLikeHtml(s), s).toBe(false);
    }
  });
});

describe('htmlToPieces', () => {
  describe('text that is not an HTML page', () => {
    it('gives exactly what the tag-stripping regex gave, uncapped', () => {
      const long = 'expected a < b, got <nil>; '.repeat(100);
      expect(long.length).toBeGreaterThan(1000);
      expect(text(long)).toBe(legacy(long));
      expect(text('a < b <i>c</i>')).toBe('a < b c');
      expect(text('<nil>')).toBe('');
    });

    it('returns no pieces for empty or whitespace-only input', () => {
      expect(htmlToPieces('')).toEqual([]);
      expect(htmlToPieces('  \n ')).toEqual([]);
    });
  });

  describe('styles', () => {
    it('marks headings, strong, emphasis and code', () => {
      expect(htmlToPieces('<h1>Not Found</h1><p>The page is <b>gone</b>, <em>sorry</em>: <code>/x</code></p>'))
        .toEqual([h('Not Found'), t('\nThe page is '), b('gone'), t(', '), em('sorry'), t(': '), code('/x')]);
      for (const tag of ['h2', 'h3', 'h4', 'h5', 'h6']) {
        expect(htmlToPieces(`<p>a</p><${tag}>x</${tag}>`), tag).toEqual([t('a\n'), h('x')]);
      }
      for (const tag of ['strong', 'b']) {
        expect(htmlToPieces(`<p>a <${tag}>x</${tag}></p>`), tag).toEqual([t('a '), b('x')]);
      }
      for (const tag of ['em', 'i']) {
        expect(htmlToPieces(`<p>a <${tag}>x</${tag}></p>`), tag).toEqual([t('a '), em('x')]);
      }
      for (const tag of ['code', 'tt', 'kbd', 'samp']) {
        expect(htmlToPieces(`<p>a <${tag}>x</${tag}></p>`), tag).toEqual([t('a '), code('x')]);
      }
      expect(htmlToPieces('<p>a</p><pre>Cannot GET /v2/catalog</pre>')).toEqual([t('a\n'), code('Cannot GET /v2/catalog')]);
    });

    it('lets code win over heading, heading over strong, strong over emphasis', () => {
      expect(htmlToPieces('<h2><code>x</code></h2>')).toEqual([code('x')]);
      expect(htmlToPieces('<p><strong><code>x</code></strong></p>')).toEqual([code('x')]);
      expect(htmlToPieces('<h1><b>x</b></h1>')).toEqual([h('x')]);
      expect(htmlToPieces('<p><em><strong>x</strong></em></p>')).toEqual([b('x')]);
      expect(htmlToPieces('<p><b><i>x</i></b></p>')).toEqual([b('x')]);
    });

    it('merges neighbouring pieces of the same style', () => {
      expect(htmlToPieces('<p><b>a</b><strong>b</strong></p>')).toEqual([b('ab')]);
      expect(htmlToPieces('<p>a<span>b</span>c</p>')).toEqual([t('abc')]);
    });

    it('is case-insensitive about tag names', () => {
      expect(htmlToPieces('<P>a <B>x</B></P><SCRIPT>no</SCRIPT>')).toEqual([t('a '), b('x')]);
    });
  });

  describe('unwrapped and dropped elements', () => {
    it('keeps the words of links, spans and unknown elements, never their attributes', () => {
      expect(text('<p>See <a href="https://evil.example/">the docs</a> and <span class="x">this</span>.<foo bar>baz</foo></p>'))
        .toBe('See the docs and this.baz');
    });

    it('reads attributes quote-aware, so a quoted > does not end the tag', () => {
      expect(text('<p title="a > b" data-x=\'c > d\'>Hello</p>')).toBe('Hello');
      expect(text('<p class=x"y>Hello</p>')).toBe('Hello');
    });

    it('drops script, style and title text', () => {
      expect(text('<html><title>T</title><style>p { color: red }</style><body><script>alert(1)</script>'
        + '<p>Body</p></body></html>')).toBe('Body');
      expect(text('<p>a</p><script type="text/javascript">if (a < b) { x = "</p>" }</script ><p>b</p>')).toBe('a\nb');
    });

    it('drops head, noscript, template and svg content', () => {
      expect(text('<html><head><meta charset="utf-8"><link rel=x>Head words</head><body><p>Body</p></body></html>')).toBe('Body');
      expect(text('<html><head><meta charset="utf-8"><body><p>Body</p>')).toBe('Body');
      expect(text('<p>a</p><noscript>Enable JS</noscript><template><p>t</p></template>'
        + '<svg viewBox="0 0 1 1"><text>s</text><svg><text>n</text></svg>s</svg><svg/><p>b</p>')).toBe('a\nb');
    });

    it('skips comments, doctypes and processing instructions', () => {
      expect(text('<?xml version="1.0"?><!DOCTYPE html><p>a<!-- <p>hidden</p> -->b</p><![CDATA[x]]>')).toBe('ab');
    });

    it('treats < not followed by a letter as literal text', () => {
      expect(text('<p>1 < 2 and 3 <= 4 <3</p>')).toBe('1 < 2 and 3 <= 4 <3');
    });
  });

  describe('line breaks', () => {
    it('breaks between blocks and at br', () => {
      expect(text('<div>a</div><div>b</div>')).toBe('a\nb');
      expect(text('<p>a<br>b<br/>c</p>')).toBe('a\nb\nc');
      for (const tag of ['p', 'div', 'center', 'main', 'section', 'article', 'header', 'footer', 'h1', 'li', 'ul',
        'ol', 'pre', 'table', 'tr', 'blockquote', 'address', 'dl', 'dt', 'dd']) {
        expect(text(`<p>a</p>b<${tag}>c</${tag}>d`), tag).toBe(`a\nb\nc\nd`.replace('\nc', tag === 'li' ? '\n• c' : '\nc'));
      }
      expect(text('<p>a</p><hr>b')).toBe('a\nb');
    });

    it('prefixes list items with a bullet', () => {
      expect(htmlToPieces('<html><ul><li>one</li><li><b>two</b></li><li> </li></ul><p>after</p>'))
        .toEqual([t('• one\n• '), b('two'), t('\nafter')]);
    });

    it('gives one line break for any run of blocks with no readable text between them', () => {
      expect(text('<p>first</p><div></div><div>&nbsp;</div><center> </center><p>second</p>')).toBe('first\nsecond');
      expect(text('first<div></div><div>&nbsp;</div><center> </center>second')).toBe('first\nsecond');
      expect(text('first<div><div><center></center></div></div>second')).toBe('first\nsecond');
      expect(text('first<br><br> <br>second')).toBe('first\nsecond');
    });

    it('never starts or ends with a line break', () => {
      expect(text('<div><br><p> </p>text<br><div>&nbsp;</div></div>')).toBe('text');
      expect(text('<center><h1>\n Title \n</h1></center>\n<hr>\n')).toBe('Title');
    });

    it('drops the space next to a break', () => {
      expect(text('Body: <h1>504</h1> The server')).toBe('Body:\n504\nThe server');
    });

  });

  describe('table cells', () => {
    it('separates the cells of a row with a space', () => {
      expect(text('<h2>HTTP ERROR 404</h2><table><tr><th>URI:</th><td>/foo</td></tr></table>')).toBe('HTTP ERROR 404\nURI: /foo');
    });

    it('breaks between rows', () => {
      expect(text('<html><table><tr><th>A</th><td>1</td></tr><tr><th>B</th><td>2</td></tr></table>')).toBe('A 1\nB 2');
    });

    it('gives one space for empty cells and the spaces around them', () => {
      expect(text('<html><table><tr><td>a</td><td></td><td>b</td></tr></table>')).toBe('a b');
      expect(text('<html><table><tr><td>a</td><td></td><td> </td><td>b</td></tr></table>')).toBe('a b');
      expect(text('<html><table><tr><th> A </th><td>&nbsp;1 </td><td></td></tr></table>')).toBe('A 1');
    });

    it('gives only the line break where a cell holds a block', () => {
      expect(text('<html><table><tr><th>A</th><td><p>1</p></td><td>2</td></tr></table>')).toBe('A\n1\n2');
    });

    it('keeps the style of cell content', () => {
      expect(htmlToPieces('<html><table><tr><th><b>Type</b></th><td>x</td></tr></table>')).toEqual([b('Type'), t(' x')]);
    });
  });

  describe('entities', () => {
    it('decodes the named set, numeric references and leaves unknown names literal', () => {
      expect(text('<p>&lt;b&gt; &amp; &quot;q&quot; &apos;a&apos; &copy; &reg; &trade; &hellip; &mdash; &ndash;</p>'))
        .toBe('<b> & "q" \'a\' © ® ™ … — –');
      expect(text('<p>&lsquo;&rsquo; &ldquo;&rdquo; &laquo;&raquo; &middot; &bull; &times;</p>')).toBe('‘’ “” «» · • ×');
      expect(text('<p>&#65;&#x42;&#X43;&#128512;&#47;</p>')).toBe('ABC😀/');
      expect(text('<p>&#0; &#x110000; &#xD800; &#99999999;</p>')).toBe('� � � �');
      expect(text('<p>&bogus; &amp &AMP; &#; &#x;</p>')).toBe('&bogus; &amp &AMP; &#; &#x;');
      expect(text('<p>&amp;lt;</p>')).toBe('&lt;');
    });

    it('shows encoded markup as literal text instead of parsing it', () => {
      expect(htmlToPieces('<p>&lt;script&gt;alert(1)&lt;/script&gt; &lt;img src=x onerror=alert(1)&gt;</p>'))
        .toEqual([t('<script>alert(1)</script> <img src=x onerror=alert(1)>')]);
    });

    it('collapses whitespace, including no-break spaces', () => {
      expect(text('<p>  a  \n\t&nbsp; b  </p>')).toBe('a b');
      expect(htmlToPieces('<p>Plan <b>small</b>\n  is   gone</p>')).toEqual([t('Plan '), b('small'), t(' is gone')]);
    });
  });

  describe('limits', () => {
    it('caps the text at 1,000 characters plus an ellipsis', () => {
      const out = text(`<p>${'x'.repeat(5000)}</p>`);
      expect(out).toBe('x'.repeat(1000) + '…');
    });

    it('does not split a surrogate pair at the cap', () => {
      const out = text(`<p>${'x'.repeat(999)}${'😀'.repeat(10)}</p>`);
      expect(out).toBe('x'.repeat(999) + '…');
    });

    it('caps the text when it falls back to stripping tags', () => {
      const out = text(`<p>${'y '.repeat(2000)}<a href="unterminated`);
      expect(out).toBe(legacy(`<p>${'y '.repeat(2000)}`).slice(0, 1000).trimEnd() + '…');
    });
  });

  describe('fallbacks', () => {
    it('strips tags the old way when a construct is never closed', () => {
      expect(text('<p>hi</p><!-- x')).toBe('hi <!-- x');
      expect(text('<p>a</p><script>var x')).toBe('a var x');
      expect(text('<p>a</p><p class="b')).toBe('a <p class="b');
      expect(text('<p>a</p></p')).toBe('a </p');
    });

    it('uses the title as a heading when the body has no readable text', () => {
      expect(htmlToPieces('<html><head><title>503 Service &amp; Co</title></head><body>&nbsp;</body></html>'))
        .toEqual([h('503 Service & Co')]);
      expect(htmlToPieces(`<html><title>${'T'.repeat(300)}</title><body></body></html>`))
        .toEqual([h('T'.repeat(200))]);
    });

    it('strips tags the old way when there is neither readable text nor a title', () => {
      expect(text('<html><head><script>alert(1)</script></head></html>')).toBe('alert(1)');
      expect(htmlToPieces('<div><span></span></div>')).toEqual([]);
    });
  });
});

// The text is a server's error body, so it can be anything. Every input here
// must finish in linear time: a parser that searches again from each '<' or
// '&' after a failed search goes quadratic and takes seconds.
describe('htmlToPieces on adversarial input', () => {
  const n = 100_000;
  const cases: Array<[string, string]> = [
    ['a run of <', '<'.repeat(n) + 'x'],
    ['a page then a run of <', '<html>' + '<'.repeat(n) + 'x'],
    ['an unterminated double quote', '<p a="' + 'x'.repeat(10 * n)],
    ['an unterminated single quote', '<p a=\'' + 'x'.repeat(10 * n)],
    ['an unterminated attribute list', '<p ' + 'a '.repeat(5 * n)],
    ['a run of tag-like starts', '<p>' + '<a'.repeat(n)],
    ['a flood of comment openers', '<html>' + '<!--'.repeat(n)],
    ['a flood of declarations', '<html>' + '<!'.repeat(n)],
    ['a flood of script openers', '<html>' + '<script>'.repeat(n)],
    ['a flood of title openers', '<html>' + '<title>'.repeat(n)],
    ['a flood of unclosed title end tags', '<html><title>a' + '</title'.repeat(n)],
    ['a flood of end-tag openers', '<html>' + '</'.repeat(n)],
    // Inside head nothing is written, so the output cap cannot end the pass.
    ['a flood of end-tag openers in the head', '<html><head>' + '</'.repeat(n)],
    ['a flood of comment openers in the head', '<html><head>' + '<!--'.repeat(n)],
    ['a flood of tag starts in an svg', '<p><svg>' + '<a'.repeat(n)],
    ['a flood of &', '<p>' + '&'.repeat(n)],
    ['a flood of &#', '<p>' + '&#'.repeat(n)],
    ['a long entity name', '<p>&' + 'a'.repeat(n)],
    ['many long entity names', '<p>' + ('&' + 'a'.repeat(40)).repeat(n / 40)],
    ['a flood of bold tags', '<p>' + '<b>'.repeat(n)],
    ['a flood of paragraphs', '<p>'.repeat(n)],
    ['many closed scripts', '<p>' + '<script></script>'.repeat(n / 10) + 'end'],
    ['a 1 MB style', '<html><style>' + 'x'.repeat(1_000_000) + '</style><p>after</p>'],
  ];

  it.each(cases)('stays linear on %s', (_name, input) => {
    expect(input.length).toBeGreaterThanOrEqual(n);
    const start = performance.now();
    htmlToPieces(input);
    expect(performance.now() - start).toBeLessThan(500);
  });

  it('still reads the message after a 1 MB style', () => {
    expect(text('<html><style>' + 'x'.repeat(1_000_000) + '</style><p>after</p>')).toBe('after');
  });

  it('only scans the first MiB of a larger body', () => {
    const start = performance.now();
    expect(text('<p>head</p>' + ' '.repeat(2 * 1024 * 1024) + '<p>tail</p>')).toBe('head');
    expect(performance.now() - start).toBeLessThan(500);
  });
});
