import { describe, expect, it } from 'vitest';

import { GetAllCfEvents } from './cf-event.actions';

describe('GetAllCfEvents (V3 native)', () => {
  it('constructs an absolute /pp/v1/cf/audit_events/{cnsi} URL', () => {
    const action = new GetAllCfEvents('pkey', 'cnsi-1');
    expect(action.options.url).toBe('/pp/v1/cf/audit_events/cnsi-1');
  });

  it('issues a GET request', () => {
    const action = new GetAllCfEvents('pkey', 'cnsi-1');
    expect(action.options.method).toBe('GET');
  });
});
