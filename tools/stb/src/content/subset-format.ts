// Closed-grammar "subset" content format — grammar v1:
//   **bold** → <strong>, _italic_ → <em>, newline → <br>; EVERYTHING else is text.
// The parser only ever constructs strong/em/br elements and text nodes; there is
// deliberately NO innerHTML anywhere in this module (the DOM form is built node
// by node, the HTML form by escaping text segments). Unterminated markers render
// literally as text. public/preview-shim.js carries a plain-JS mirror of this
// parser — keep the two in lockstep.

export type ContentFormat = 'plain' | 'subset';

type SubsetNode =
  | { t: 'text'; v: string }
  | { t: 'br' }
  | { t: 'strong' | 'em'; children: SubsetNode[] };

function parseSpan(s: string): SubsetNode[] {
  const out: SubsetNode[] = [];
  let buf = '';
  const flush = (): void => {
    if (buf) { out.push({ t: 'text', v: buf }); buf = ''; }
  };
  let i = 0;
  while (i < s.length) {
    const ch = s[i]!;
    if (ch === '\n') { flush(); out.push({ t: 'br' }); i++; continue; }
    if (s.startsWith('**', i)) {
      const end = s.indexOf('**', i + 2);
      if (end !== -1) {
        flush();
        out.push({ t: 'strong', children: parseSpan(s.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
      // unterminated ** → literal text
    } else if (ch === '_') {
      const end = s.indexOf('_', i + 1);
      if (end !== -1) {
        flush();
        out.push({ t: 'em', children: parseSpan(s.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
      // unterminated _ → literal text
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

function appendNodes(parent: Element, nodes: SubsetNode[]): void {
  const doc = parent.ownerDocument;
  for (const n of nodes) {
    if (n.t === 'text') {
      parent.appendChild(doc.createTextNode(n.v));
    } else if (n.t === 'br') {
      parent.appendChild(doc.createElement('br'));
    } else {
      const el = doc.createElement(n.t);
      appendNodes(el, n.children);
      parent.appendChild(el);
    }
  }
}

/** Render subset-formatted text into `el` by DOM construction (replaces children). */
export function renderSubsetInto(el: Element, text: string): void {
  el.textContent = '';
  appendNodes(el, parseSpan(text));
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
const escapeText = (s: string): string => s.replace(/[&<>"']/g, (c) => ESCAPES[c]!);

function serialize(nodes: SubsetNode[]): string {
  return nodes
    .map((n) => {
      if (n.t === 'text') return escapeText(n.v);
      if (n.t === 'br') return '<br>';
      return `<${n.t}>${serialize(n.children)}</${n.t}>`;
    })
    .join('');
}

/** Serialize subset-formatted text to safe HTML: text segments are escaped
 *  (&<>"'), tags come only from the closed set {strong, em, br}. */
export function subsetToSafeHtml(text: string): string {
  return serialize(parseSpan(text));
}
