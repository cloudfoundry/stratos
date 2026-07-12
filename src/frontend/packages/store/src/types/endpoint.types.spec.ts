import { describe, expect, it } from 'vitest';

import { computeConnectionStatus } from './endpoint.types';

describe('computeConnectionStatus', () => {
  const future = Math.floor(Date.now() / 1000) + 3600;
  const past = Math.floor(Date.now() / 1000) - 3600;
  const user = { guid: 'u1' };

  it('disconnected when no user token stored', () => {
    expect(computeConnectionStatus({})).toBe('disconnected');
  });
  it('connected for a healthy token', () => {
    expect(computeConnectionStatus({ user, token_expiry: future, token_renewable: true })).toBe('connected');
  });
  it('expired when past expiry with no refresh token (incl. disposed-after-rejection)', () => {
    expect(computeConnectionStatus({ user, token_expiry: past, token_renewable: false })).toBe('expired');
  });
  it('connected when past expiry but renewable on use', () => {
    expect(computeConnectionStatus({ user, token_expiry: past, token_renewable: true })).toBe('connected');
  });
  it('connected when no expiry is known', () => {
    expect(computeConnectionStatus({ user })).toBe('connected');
  });
  it('connected when token_expiry is 0 (documented no-expiry value), even if not renewable', () => {
    expect(computeConnectionStatus({ user, token_expiry: 0, token_renewable: false })).toBe('connected');
  });
});
