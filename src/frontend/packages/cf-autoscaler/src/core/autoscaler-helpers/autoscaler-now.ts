import { addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { AppAutoscalerEvent, AppAutoscalerPolicy, AppRecurringSchedule, AppScalingRule } from '../../store/app-autoscaler.types';

/**
 * The instance limits in effect now: the default limits, or the schedule
 * that overrides them. Times are in the policy timezone, as the schedules
 * are written.
 */
export interface AutoscalerLimitsNow {
  min: number;
  max: number;
  source: 'default' | 'recurring' | 'specific';
  // When the running schedule ends
  until?: string;
  // When the next schedule starts, if none is running
  next?: { at: string; min: number; max: number };
}

// A days-of-month schedule can skip a month (the 31st)
const DAYS_AHEAD = 62;

export function limitsNow(policy: AppAutoscalerPolicy, now = new Date()): AutoscalerLimitsNow {
  const base: AutoscalerLimitsNow = { min: policy.instance_min_count, max: policy.instance_max_count, source: 'default' };
  const tz = policy.schedules?.timezone;
  if (!tz) {
    return base;
  }
  const specific = policy.schedules?.specific_date ?? [];
  const recurring = policy.schedules?.recurring_schedule ?? [];
  const at = (d: Date, f: string) => formatInTimeZone(d, tz, f);
  const runsOn = (r: AppRecurringSchedule, d: Date) => {
    const date = at(d, 'yyyy-MM-dd');
    if ((r.start_date && date < r.start_date) || (r.end_date && date > r.end_date)) {
      return false;
    }
    // Days of the week run 1 (Monday) to 7 (Sunday), as ISO 'i' does
    return r.days_of_week?.length ? r.days_of_week.includes(Number(at(d, 'i'))) : !!r.days_of_month?.includes(Number(at(d, 'd')));
  };
  // The schedule stamps compare as strings: 'yyyy-MM-ddTHH:mm' and 'HH:mm'
  const stamp = at(now, "yyyy-MM-dd'T'HH:mm");
  const time = at(now, 'HH:mm');

  // A specific date wins over a recurring schedule, as in the autoscaler
  const s = specific.find(x => x.start_date_time <= stamp && stamp < x.end_date_time);
  if (s) {
    return { min: s.instance_min_count, max: s.instance_max_count, source: 'specific', until: s.end_date_time.replace('T', ' ') };
  }
  const r = recurring.find(x => runsOn(x, now) && x.start_time <= time && time < x.end_time);
  if (r) {
    // simplification: a specific date starting before this ends is not named
    return { min: r.instance_min_count, max: r.instance_max_count, source: 'recurring', until: r.end_time };
  }

  const starts = specific.filter(x => x.start_date_time > stamp)
    .map(x => ({ at: x.start_date_time, min: x.instance_min_count, max: x.instance_max_count }));
  for (let d = 0; d < DAYS_AHEAD; d++) {
    const day = addDays(now, d);
    const today = recurring.filter(x => runsOn(x, day) && (d > 0 || x.start_time > time));
    starts.push(...today.map(x => ({ at: `${at(day, 'yyyy-MM-dd')}T${x.start_time}`, min: x.instance_min_count, max: x.instance_max_count })));
    if (today.length) {
      break;
    }
  }
  const next = starts.sort((a, b) => a.at.localeCompare(b.at))[0];
  return next ? { ...base, next: { ...next, at: next.at.replace('T', ' ') } } : base;
}

// The autoscaler's cool-down when a rule sets none
const DEFAULT_COOL_DOWN_SECS = 300;

/**
 * When the cool-down after a dynamic scaling event ends (ms since epoch), or
 * null when there is none. The event names its rule only in the reason text
 * ("+1 instance(s) because memoryused >= 400MB for 120 seconds").
 */
export function coolDownUntil(event: AppAutoscalerEvent | undefined, rules: AppScalingRule[] = []): number | null {
  // status 0 is succeeded, scaling_type 0 is dynamic
  if (!event || event.status !== 0 || event.scaling_type !== 0) {
    return null;
  }
  // simplification: a threshold that prefixes another (400 vs 4000) on the same metric and operator can match the wrong rule
  const rule = rules.find(x => event.reason?.includes(`because ${x.metric_type} ${x.operator} ${x.threshold}`));
  if (!rule) {
    return null;
  }
  return event.timestamp / 1e6 + (rule.cool_down_secs ?? DEFAULT_COOL_DOWN_SECS) * 1000;
}
