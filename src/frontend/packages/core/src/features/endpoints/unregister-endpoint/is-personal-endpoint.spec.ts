import { describe, it, expect } from 'vitest';

import { isPersonalEndpoint } from './unregister-endpoint';

describe('isPersonalEndpoint', () => {
  it('is not personal for a stored system endpoint, whatever the form says', () => {
    expect(isPersonalEndpoint({ creator: { system: true } }, false, false)).toBe(false);
  });

  it('is personal for a stored endpoint created by a user', () => {
    expect(isPersonalEndpoint({ creator: { system: false } }, true, true)).toBe(true);
  });

  it('is system when not stored yet and an admin left system ticked', () => {
    expect(isPersonalEndpoint(undefined, true, true)).toBe(false);
  });

  it('is personal when not stored yet and an admin unticked system', () => {
    expect(isPersonalEndpoint(undefined, true, false)).toBe(true);
  });

  it('is personal when not stored yet and the user is not an admin', () => {
    expect(isPersonalEndpoint(undefined, false, true)).toBe(true);
  });
});
