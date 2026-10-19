import { describe, it, expect } from 'vitest';

import { AUTOSCALER_TIMEZONES, autoscalerDefaultTimezone } from './autoscaler-timezones';

describe('autoscaler timezones', () => {
  // The autoscaler (14.x and 15.x) accepts only the zones in its policy
  // schema; a browser zone outside it made every save fail with 400.
  it('offers only zones the autoscaler accepts', () => {
    expect(AUTOSCALER_TIMEZONES).toContain('America/Los_Angeles');
    expect(AUTOSCALER_TIMEZONES).toContain('Etc/UTC');
    expect(AUTOSCALER_TIMEZONES).not.toContain('America/Puerto_Rico');
    expect(AUTOSCALER_TIMEZONES).toHaveLength(582);
  });

  it('defaults to the browser zone when the autoscaler accepts it', () => {
    expect(autoscalerDefaultTimezone('Europe/Berlin')).toBe('Europe/Berlin');
  });

  it('falls back to UTC for a browser zone the autoscaler rejects', () => {
    expect(autoscalerDefaultTimezone('America/Puerto_Rico')).toBe('Etc/UTC');
  });
});
