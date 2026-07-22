export interface RenameRule {
  from: string;
  to: string;
}

export interface RenameResult {
  text: string;
  replacements: { rule: RenameRule; count: number }[];
}

function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function applyRenames(input: string, rules: RenameRule[]): RenameResult {
  let text = input;
  const replacements: { rule: RenameRule; count: number }[] = [];
  for (const rule of rules) {
    const pattern = new RegExp(escapeRegex(rule.from), 'g');
    let count = 0;
    text = text.replace(pattern, () => {
      count++;
      return rule.to;
    });
    replacements.push({ rule, count });
  }
  return { text, replacements };
}
