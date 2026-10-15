import { describe, expect, it } from 'vitest';
import { unknownOutcomeMessage } from './unknown-outcome-message';

describe('unknownOutcomeMessage', () => {
  it('says the operation ended, that its result is unknown, and where to look', () => {
    expect(unknownOutcomeMessage('Delete "my-db"', 'The Services list')).toBe(
      'Delete "my-db": the operation ended, but its result could not be determined. '
      + 'The Services list shows the current state.',
    );
  });

  it('never claims success or failure', () => {
    const msg = unknownOutcomeMessage('Unbind "app"', 'This page');
    expect(msg).not.toMatch(/\b(succeeded|failed|deleted|unbound)\b/i);
  });
});
