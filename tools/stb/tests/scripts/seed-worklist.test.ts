import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildWorklist } from '../../scripts/seed-worklist';

const html = readFileSync('tests/scripts/fixtures/sample.component.html', 'utf8');

describe('buildWorklist', () => {
  const rows = buildWorklist(html, 'cf-users.component.html');

  it('flags a data-test element lacking a snapshot-id', () => {
    const row = rows.find((r) => r.dataTest === 'add-user');
    expect(row).toBeTruthy();
    expect(row!.suggestedId).toBe('cf.users.add-user');
  });

  it('skips elements that already have data-stratos-snapshot-id', () => {
    expect(rows.find((r) => r.dataTest === 'already-done')).toBeUndefined();
  });

  it('suggests a leaf config field from the data-test value', () => {
    const html = '<h1 data-test="login-title">Hi</h1>';
    const rows = buildWorklist(html, 'login-page.component.html');
    expect(rows[0]!.suggestedConfig).toBe('title');
  });
});
