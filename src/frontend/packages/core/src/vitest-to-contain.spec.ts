import { describe, it, expect } from 'vitest';

// Vitest hands toContain on null/undefined to chai's include, which reads a
// keyless object or function argument as "has all of these (no) properties"
// and passes. A spec that looks a value up and expects it in a missing list
// then passes without checking anything. The workspace setup makes it fail.
describe('expect().toContain on a missing value', () => {
  const guard = () => undefined;

  it('fails for undefined', () => {
    expect(() => expect(undefined).toContain(guard)).toThrow(/toContain/);
  });

  it('fails for null', () => {
    expect(() => expect(null).toContain({})).toThrow(/toContain/);
  });

  it('still finds a value in an array', () => {
    expect([guard]).toContain(guard);
    expect(() => expect([]).toContain(guard)).toThrow();
  });
});
