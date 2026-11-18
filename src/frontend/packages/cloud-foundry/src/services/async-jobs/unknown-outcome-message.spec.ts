import { afterEach, describe, expect, it } from 'vitest';
import { unknownOutcomeMessage } from './unknown-outcome-message';
import { setJobTrackingLimit } from './write-with-job';

describe('unknownOutcomeMessage', () => {
  afterEach(() => setJobTrackingLimit(60));

  it('says the operation ended, that its result is unknown, and where to look', () => {
    expect(unknownOutcomeMessage('Delete "my-db"', 'The Services list', 'ended')).toBe(
      'Delete "my-db": the operation ended, but its result could not be determined. '
      + 'The Services list shows the current state.',
    );
  });

  it('says an operation followed for the whole limit is still running in Cloud Foundry', () => {
    expect(unknownOutcomeMessage('Delete key "k1"', 'The Service Keys list', 'still-running')).toBe(
      'Delete key "k1": still running in Cloud Foundry after 1 h, so Stratos stopped checking on it. '
      + 'The Service Keys list shows its current state.',
    );
    setJobTrackingLimit(90);
    expect(unknownOutcomeMessage('Unbind "app"', 'This page', 'still-running')).toContain('after 1 h 30 min,');
    setJobTrackingLimit(30);
    expect(unknownOutcomeMessage('Unbind "app"', 'This page', 'still-running')).toContain('after 30 min,');
  });

  it('never claims success or failure', () => {
    for (const how of ['ended', 'still-running'] as const) {
      const msg = unknownOutcomeMessage('Unbind "app"', 'This page', how);
      expect(msg).not.toMatch(/\b(succeeded|failed|deleted|unbound)\b/i);
    }
  });
});
