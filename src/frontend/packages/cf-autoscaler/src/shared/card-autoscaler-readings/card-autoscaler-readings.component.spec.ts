import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { AppAutoscalerMetricDataLocal, AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';
import { CardAutoscalerReadingsComponent } from './card-autoscaler-readings.component';

const rule = { metric_type: 'cpu', operator: '>=', threshold: 80, adjustment: '+1' };
const policy = {
  instance_min_count: 1, instance_max_count: 2, enabled: true, scaling_rules_form: [],
  scaling_rules_map: { cpu: { upper: [rule], lower: [] }, memoryused: { upper: [{ ...rule, metric_type: 'memoryused' }], lower: [] } },
} as AppAutoscalerPolicyLocal;

// Local times, so the expected strings hold in any timezone
const at = (stamp: string) => new Date(stamp).getTime() / 1000;
const reading = (value: number, time: number, color = 'rgb(1, 2, 3)') => signal([{
  entity: { latest: { target: [{ name: 'm', value, time }], colorTarget: [{ name: 'm', value: color }] } } as AppAutoscalerMetricDataLocal,
}]);

function render(cpu: number, mem: number) {
  TestBed.configureTestingModule({ imports: [CardAutoscalerReadingsComponent], providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(CardAutoscalerReadingsComponent);
  fixture.componentRef.setInput('policy', policy);
  fixture.componentRef.setInput('metrics', { cpu: reading(3, cpu), memoryused: reading(48, mem) });
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const taken = (el: HTMLElement) => el.querySelector('[data-test="readings-taken"]')?.textContent?.trim();

describe('CardAutoscalerReadingsComponent', () => {
  it('shows the oldest and newest reading times, the date once', () => {
    expect(taken(render(at('2026-10-24T02:03:41'), at('2026-10-24T02:03:11')))).toBe('2026-10-24 02:03:11–02:03:41');
  });

  it('shows one time when the readings share it', () => {
    expect(taken(render(at('2026-10-24T02:03:11'), at('2026-10-24T02:03:11')))).toBe('2026-10-24 02:03:11');
  });

  it('repeats the date when the readings span midnight', () => {
    expect(taken(render(at('2026-10-23T23:59:50'), at('2026-10-24T00:00:10')))).toBe('2026-10-23 23:59:50–2026-10-24 00:00:10');
  });

  it('gives each reading its status colour dot', () => {
    const el = render(at('2026-10-24T02:03:11'), at('2026-10-24T02:03:11'));
    const dots = [...el.querySelectorAll<HTMLElement>('dt span')].map(d => d.style.backgroundColor);
    expect(dots).toEqual(['rgb(1, 2, 3)', 'rgb(1, 2, 3)']);
  });
});
