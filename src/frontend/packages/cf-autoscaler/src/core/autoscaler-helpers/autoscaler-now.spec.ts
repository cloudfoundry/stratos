import { describe, expect, it } from 'vitest';

import { AppAutoscalerEvent, AppAutoscalerPolicy } from '../../store/app-autoscaler.types';
import { coolDownUntil, limitsNow } from './autoscaler-now';

const policy: AppAutoscalerPolicy = {
  instance_min_count: 1,
  instance_max_count: 4,
  schedules: {
    timezone: 'America/Los_Angeles',
    recurring_schedule: [
      { start_time: '08:00', end_time: '18:00', days_of_week: [1, 2, 3, 4, 5], instance_min_count: 2, instance_max_count: 6 },
    ],
    specific_date: [
      { start_date_time: '2026-12-01T09:00', end_date_time: '2026-12-01T17:00', instance_min_count: 3, instance_max_count: 8 },
    ],
  },
};

// 2026-10-23 is a Friday; Los Angeles is UTC-7 then.
const la = (stamp: string) => new Date(`${stamp}-07:00`);

describe('limitsNow', () => {
  it('uses the default limits when no schedule is running, and names the next start', () => {
    expect(limitsNow(policy, la('2026-10-23T19:00'))).toEqual({
      min: 1, max: 4, source: 'default', next: { at: '2026-10-26 08:00', min: 2, max: 6 },
    });
  });

  it('uses a running recurring schedule until it ends', () => {
    expect(limitsNow(policy, la('2026-10-23T09:30'))).toEqual({ min: 2, max: 6, source: 'recurring', until: '18:00' });
  });

  it('starts a recurring schedule later the same day', () => {
    expect(limitsNow(policy, la('2026-10-23T07:00')).next).toEqual({ at: '2026-10-23 08:00', min: 2, max: 6 });
  });

  it('gives a specific date priority over a recurring schedule', () => {
    // 2026-12-01 is a Tuesday, so the recurring schedule runs too.
    expect(limitsNow(policy, new Date('2026-12-01T10:00-08:00'))).toEqual({
      min: 3, max: 8, source: 'specific', until: '2026-12-01 17:00',
    });
  });

  it('uses the default limits with no schedules', () => {
    expect(limitsNow({ instance_min_count: 1, instance_max_count: 2 }, la('2026-10-23T09:30')))
      .toEqual({ min: 1, max: 2, source: 'default' });
  });
});

describe('coolDownUntil', () => {
  const rules = [
    { metric_type: 'memoryused', operator: '>=', threshold: 400, adjustment: '+1', cool_down_secs: 600 },
    { metric_type: 'cpu', operator: '<', threshold: 10, adjustment: '-1' },
  ];
  const event = (reason: string, scaling_type = 0): AppAutoscalerEvent => ({
    app_id: 'a', error: '', message: '', new_instances: 2, old_instances: 1, reason, scaling_type, status: 0,
    timestamp: 1_000_000 * 1_000_000,
  });

  it('adds the cool-down of the rule that fired', () => {
    expect(coolDownUntil(event('+1 instance(s) because memoryused >= 400MB for 120 seconds'), rules))
      .toBe(1_000_000 + 600_000);
  });

  it('uses the autoscaler default of 300 seconds when the rule sets none', () => {
    expect(coolDownUntil(event('-1 instance(s) because cpu < 10% for 120 seconds'), rules)).toBe(1_000_000 + 300_000);
  });

  it('has none for a scheduled event', () => {
    expect(coolDownUntil(event('+1 instance(s) because limited by min instances 2', 1), rules)).toBeNull();
  });
});
