import { effect } from '@preact/signals-core';
import { tokenMetadata, effectiveValue, type TokenSpec } from '@/state/tokens';
import { previewDark } from '@/state/scene';

export interface TokenSidebarOptions {
  onSwatchClick?: (token: TokenSpec) => void;
  onTokenInsert?: (tokenName: string) => void;
  onHover?: (tokenName: string | null) => void;
}

export function mountTokenSidebar(host: HTMLElement, opts: TokenSidebarOptions = {}): void {
  host.classList.add('stb-sidebar');
  host.innerHTML = '';

  for (const group of tokenMetadata.groups) {
    const groupEl = document.createElement('section');
    groupEl.className = 'stb-group';
    const h = document.createElement('h3');
    h.textContent = group.name;
    h.title = group.description;
    groupEl.appendChild(h);

    for (const token of group.tokens) {
      const row = document.createElement('div');
      row.className = 'stb-token-row';
      row.dataset.token = token.name;

      const swatch = document.createElement('button');
      swatch.className = 'stb-swatch';
      swatch.setAttribute('aria-label', `Edit ${token.name}`);
      swatch.dataset.token = token.name;
      row.appendChild(swatch);

      const name = document.createElement('button');
      name.className = 'stb-token-name';
      name.textContent = token.name;
      name.dataset.token = token.name;
      row.appendChild(name);

      const valueEl = document.createElement('span');
      valueEl.className = 'stb-token-value';
      valueEl.dataset.value = '';
      row.appendChild(valueEl);

      groupEl.appendChild(row);
    }

    host.appendChild(groupEl);
  }

  effect(() => {
    const dark = previewDark.value;
    host.querySelectorAll<HTMLElement>('.stb-token-row').forEach((row) => {
      const tokenName = row.dataset.token!;
      const value = effectiveValue(tokenName, dark);
      const swatch = row.querySelector<HTMLElement>('.stb-swatch');
      const valueEl = row.querySelector<HTMLElement>('.stb-token-value');
      if (swatch) swatch.style.backgroundColor = value;
      if (valueEl) valueEl.textContent = value;
    });
  });

  host.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.classList.contains('stb-swatch')) {
      const tokenName = target.dataset.token!;
      const spec = findToken(tokenName);
      if (spec && opts.onSwatchClick) opts.onSwatchClick(spec);
    } else if (target.classList.contains('stb-token-name')) {
      if (opts.onTokenInsert) opts.onTokenInsert(target.dataset.token!);
    }
  });

  host.addEventListener('mouseover', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const row = t.closest<HTMLElement>('.stb-token-row');
    opts.onHover?.(row?.dataset.token ?? null);
  });
  host.addEventListener('mouseleave', () => opts.onHover?.(null));
}

function findToken(name: string): TokenSpec | undefined {
  for (const g of tokenMetadata.groups) for (const t of g.tokens) if (t.name === name) return t;
  return undefined;
}
