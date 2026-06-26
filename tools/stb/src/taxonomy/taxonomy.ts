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
  const registered = new Set(taxonomy.terms.map((t) => t.term));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (registered.has(w) && !seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out;
}
