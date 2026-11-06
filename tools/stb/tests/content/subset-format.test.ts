import { describe, it, expect } from 'vitest';
import { renderSubsetInto, subsetToSafeHtml } from '@/content/subset-format';

const ALLOWED_TAGS = new Set(['STRONG', 'EM', 'BR']);

function render(text: string): HTMLElement {
  const el = document.createElement('div');
  renderSubsetInto(el, text);
  return el;
}

/** Strip the closed-set tags from the HTML form; nothing tag-like may remain. */
function residue(html: string): string {
  return html.replace(/<\/?(strong|em)>|<br>/g, '');
}

describe('subset-format grammar v1', () => {
  it('plain text becomes a single text node', () => {
    const el = render('hello world');
    expect(el.childNodes.length).toBe(1);
    expect(el.firstChild!.nodeType).toBe(Node.TEXT_NODE);
    expect(el.textContent).toBe('hello world');
  });

  it('**bold** renders a strong element', () => {
    const el = render('a **b** c');
    expect(el.querySelector('strong')!.textContent).toBe('b');
    expect(el.textContent).toBe('a b c');
  });

  it('_italic_ renders an em element', () => {
    const el = render('a _b_ c');
    expect(el.querySelector('em')!.textContent).toBe('b');
    expect(el.textContent).toBe('a b c');
  });

  it('newline renders a br element', () => {
    const el = render('a\nb');
    expect(el.querySelectorAll('br').length).toBe(1);
  });

  it('nested **_mixed_** renders em inside strong', () => {
    const el = render('**_mixed_**');
    const strong = el.querySelector('strong')!;
    expect(strong.querySelector('em')!.textContent).toBe('mixed');
  });

  it('unterminated ** renders literally as text', () => {
    const el = render('a **b');
    expect(el.querySelector('strong')).toBeNull();
    expect(el.textContent).toBe('a **b');
  });

  it('unterminated _ renders literally as text', () => {
    const el = render('snake_case');
    expect(el.querySelector('em')).toBeNull();
    expect(el.textContent).toBe('snake_case');
  });

  it('overlapping markers resolve deterministically without extra elements', () => {
    const el = render('**a_b**c_');
    expect(el.querySelector('strong')!.textContent).toBe('a_b'); // inner _ unterminated → literal
    expect(el.querySelector('em')).toBeNull();
    expect(el.textContent).toBe('a_b' + 'c_');
  });
});

describe('subset-format safety (closed element set, no injection)', () => {
  const adversarial = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '**<script>**',
    '_<img onerror=x>_',
    '</strong><script>x</script>',
    'a<b>c</b>d',
    '&lt;already escaped&gt;',
    '"quoted" & \'single\'',
    '**_mixed_**',
    '**_a**_b',
    '****',
    '__',
    '_**_**',
    '\n\n**\n**',
    'javascript:alert(1)',
    '<svg/onload=alert(1)>',
    '**<svg/onload=alert(1)>**',
  ];

  it.each(adversarial)('DOM form of %j only ever contains strong/em/br elements', (text) => {
    const el = render(text);
    for (const child of el.querySelectorAll('*')) {
      expect(ALLOWED_TAGS.has(child.tagName)).toBe(true);
    }
    // no markup interpretation of the input: raw < survives as text
    expect(el.querySelector('script, img, svg')).toBeNull();
  });

  it.each(adversarial)('HTML form of %j has no unescaped angle brackets outside the closed tag set', (text) => {
    const html = subsetToSafeHtml(text);
    expect(residue(html)).not.toMatch(/[<>]/);
  });

  it('escapes &, <, >, ", \' in text segments of the HTML form', () => {
    expect(subsetToSafeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });

  it('fuzz: random marker/angle-bracket soup never escapes the closed set', () => {
    const alphabet = ['*', '**', '_', '\n', '<', '>', '&', '"', "'", 'a', '<script>', '</em>', 'onerror='];
    let seed = 42;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x80000000;
    for (let i = 0; i < 200; i++) {
      let s = '';
      const len = Math.floor(rnd() * 12);
      for (let j = 0; j < len; j++) s += alphabet[Math.floor(rnd() * alphabet.length)]!;
      const el = render(s);
      for (const child of el.querySelectorAll('*')) {
        expect(ALLOWED_TAGS.has(child.tagName), `input ${JSON.stringify(s)} produced <${child.tagName}>`).toBe(true);
      }
      expect(residue(subsetToSafeHtml(s))).not.toMatch(/[<>]/);
    }
  });

  it('DOM and HTML forms agree on text content', () => {
    const text = '**bold** and _italic_\n<script>x</script>';
    const el = render(text);
    const viaHtml = document.createElement('div');
    viaHtml.innerHTML = subsetToSafeHtml(text); // test-only innerHTML, on already-safe output
    expect(viaHtml.textContent).toBe(el.textContent);
  });
});
