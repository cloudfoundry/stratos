import { describe, expect, it } from 'vitest';

import { applyRenames, RenameRule } from './rename-fields';

describe('applyRenames', () => {
  const rules: RenameRule[] = [
    { from: 'metadata.created_at', to: 'entity.createdAt' },
    { from: 'metadata.updated_at', to: 'entity.updatedAt' },
  ];

  it('rewrites a TypeScript property-access chain', () => {
    const { text } = applyRenames("const d = new Date(org.metadata.created_at);", rules);
    expect(text).toBe("const d = new Date(org.entity.createdAt);");
  });

  it('rewrites multiple occurrences in one file', () => {
    const input = `
      const c = row.metadata.created_at;
      const u = row.metadata.updated_at;
    `;
    const { text } = applyRenames(input, rules);
    expect(text).toContain('row.entity.createdAt');
    expect(text).toContain('row.entity.updatedAt');
    expect(text).not.toContain('metadata.created_at');
    expect(text).not.toContain('metadata.updated_at');
  });

  it('rewrites Angular template interpolations', () => {
    const { text } = applyRenames("<div>{{ app.metadata.updated_at | date }}</div>", rules);
    expect(text).toBe("<div>{{ app.entity.updatedAt | date }}</div>");
  });

  it('does not touch unrelated property accesses', () => {
    const input = "const x = obj.metadata.guid; const y = entity.foo_bar;";
    const { text } = applyRenames(input, rules);
    expect(text).toBe(input);
  });

  it('returns the input unchanged when no rules match', () => {
    const input = "const a = 1;";
    const { text } = applyRenames(input, rules);
    expect(text).toBe(input);
  });

  it('reports the number of replacements per rule', () => {
    const input = `row.metadata.created_at; another.metadata.created_at; third.metadata.updated_at;`;
    const { replacements } = applyRenames(input, rules);
    expect(replacements).toEqual([
      { rule: rules[0], count: 2 },
      { rule: rules[1], count: 1 },
    ]);
  });
});
