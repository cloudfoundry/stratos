import { describe, it, expect, beforeEach } from 'vitest';
import {
  rememberUsername,
  forgetRememberedUsername,
  rememberedUsernameKey,
  getRememberedUsername,
} from './remembered-username';

describe('remembered-username', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips a username for a given endpoint guid', () => {
    rememberUsername('ep-1', 'alice');
    expect(window.localStorage.getItem(rememberedUsernameKey('ep-1'))).toBe('alice');
  });

  it('keeps usernames per-endpoint', () => {
    rememberUsername('ep-1', 'alice');
    rememberUsername('ep-2', 'bob');
    expect(window.localStorage.getItem(rememberedUsernameKey('ep-1'))).toBe('alice');
    expect(window.localStorage.getItem(rememberedUsernameKey('ep-2'))).toBe('bob');
  });

  it('ignores empty usernames so we never persist a placeholder', () => {
    rememberUsername('ep-1', '');
    // Use the helper so the assertion treats both '' (happy-dom) and null
    // (real localStorage) as "no value".
    expect(getRememberedUsername('ep-1')).toBeNull();
  });

  it('forgetRememberedUsername clears the per-endpoint entry', () => {
    rememberUsername('ep-1', 'alice');
    forgetRememberedUsername('ep-1');
    // Assert directly against the per-endpoint key. Can't use the helper
    // here — it falls back to the global slot, which intentionally
    // survives forget. Treat '' and null as equivalent "no value" since
    // happy-dom returns '' for missing keys.
    const raw = window.localStorage.getItem(rememberedUsernameKey('ep-1'));
    expect(raw == null || raw === '').toBe(true);
  });

  describe('getRememberedUsername', () => {
    it('returns per-endpoint value when present', () => {
      rememberUsername('ep-1', 'alice');
      expect(getRememberedUsername('ep-1')).toBe('alice');
    });

    it('falls back to the last-used global value when per-endpoint is empty', () => {
      // Simulates: user connected to ep-1, then opens the dialog for ep-2
      // for the first time — ep-2 has no per-endpoint cache, so the prefill
      // should surface the username from the most recent successful connect.
      rememberUsername('ep-1', 'alice');
      expect(getRememberedUsername('ep-2')).toBe('alice');
    });

    it('global fallback reflects the MOST RECENT remembered username', () => {
      rememberUsername('ep-1', 'alice');
      rememberUsername('ep-2', 'bob');
      // Fresh endpoint with no slot of its own picks up the latest connect.
      expect(getRememberedUsername('ep-3')).toBe('bob');
    });

    it('forgetRememberedUsername does NOT clear the global fallback', () => {
      // Disconnecting one endpoint shouldn't blank the prefill for unrelated
      // endpoints — the operator's username is still relevant elsewhere.
      rememberUsername('ep-1', 'alice');
      forgetRememberedUsername('ep-1');
      expect(getRememberedUsername('ep-2')).toBe('alice');
    });

    it('returns null when neither per-endpoint nor global is set', () => {
      expect(getRememberedUsername('ep-1')).toBeNull();
    });
  });
});
