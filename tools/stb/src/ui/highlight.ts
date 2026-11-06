export interface HighlightWiring {
  highlightToken: (token: string | null) => void;
  scrollSidebarToToken: (sidebar: HTMLElement, tokenName: string) => void;
  flashSidebarRows: (sidebar: HTMLElement, tokenNames: string[]) => void;
}

export function createHighlightWiring(): HighlightWiring {
  return {
    highlightToken: () => {},
    scrollSidebarToToken(sidebar, tokenName) {
      const row = sidebar.querySelector<HTMLElement>(`.stb-token-row[data-token="${cssEscape(tokenName)}"]`);
      if (!row) return;
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    },
    flashSidebarRows(sidebar, tokenNames) {
      const set = new Set(tokenNames);
      sidebar.querySelectorAll<HTMLElement>('.stb-token-row').forEach((row) => {
        row.classList.remove('stb-flash');
      });
      sidebar.querySelectorAll<HTMLElement>('.stb-token-row').forEach((row) => {
        if (set.has(row.dataset.token ?? '')) {
          row.classList.add('stb-flash');
        }
      });
      setTimeout(() => {
        sidebar.querySelectorAll<HTMLElement>('.stb-token-row.stb-flash').forEach((r) =>
          r.classList.remove('stb-flash'),
        );
      }, 1600);
    },
  };
}

function cssEscape(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
}
