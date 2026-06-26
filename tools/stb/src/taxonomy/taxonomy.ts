export interface Term {
  term: string;   // kebab-case vocabulary entry, e.g. 'login'
  label: string;  // human label, e.g. 'Login page'
}

export interface Taxonomy {
  terms: Term[];
}

// Deterministic term-extraction: whole-word match only, NOT fuzzy/semantic.
export function extractTerms(description: string, taxonomy: Taxonomy): string[] {
  const words = description.toLowerCase().split(/[^a-z0-9-]+/).filter(Boolean);
  const present = new Set(words);
  const out: string[] = [];
  for (const w of words) {
    if (present.has(w) && taxonomy.terms.some((t) => t.term === w) && !out.includes(w)) {
      out.push(w);
    }
  }
  return out;
}
