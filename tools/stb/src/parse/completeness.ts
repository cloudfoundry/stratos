export interface MissingReport {
  root: string[];
  dark: string[];
}

export function findMissing(
  required: Set<string>,
  root: Map<string, string>,
  dark: Map<string, string>,
): MissingReport {
  const missingIn = (m: Map<string, string>): string[] => {
    const list: string[] = [];
    for (const name of required) if (!m.has(name)) list.push(name);
    return list.sort();
  };
  return { root: missingIn(root), dark: missingIn(dark) };
}
