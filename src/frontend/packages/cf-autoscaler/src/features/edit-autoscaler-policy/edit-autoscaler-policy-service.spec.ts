import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { AutoscalerPolicyDataService } from '../../services/domain-data/autoscaler-policy-data.service';
import { EditAutoscalerPolicyService } from './edit-autoscaler-policy-service';

describe('EditAutoscalerPolicyService', () => {
  // Stands in for the policy load: loading flips true, then settles with a
  // policy (or none).
  const loading = signal(false);
  const policy = signal<any>(null);
  let loads = 0;
  const policyData = {
    load: () => { loads++; loading.set(true); return Promise.resolve(); },
    loading: () => loading.asReadonly(),
    policy: () => policy.asReadonly(),
  };
  const saved = { instance_min_count: 2, instance_max_count: 7, scaling_rules: [], scaling_rules_map: {}, scaling_rules_form: [] };

  beforeEach(() => {
    loading.set(false);
    policy.set(null);
    loads = 0;
    TestBed.configureTestingModule({
      providers: [
        ...STORE_TEST_PROVIDERS,
        EditAutoscalerPolicyService,
        { provide: AutoscalerPolicyDataService, useValue: policyData },
        provideZonelessChangeDetection(),
      ],
      imports: [
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([EditAutoscalerPolicyService], (service: EditAutoscalerPolicyService) => {
    expect(service).toBeTruthy();
  }));

  // The form showed the default limits first and the saved policy replaced
  // them when it arrived, wiping anything typed in between.
  it('emits no state until the saved policy has loaded', () => {
    const service = TestBed.inject(EditAutoscalerPolicyService);
    const seen: number[] = [];
    service.updateFromStore('app', 'cf');
    service.getState().subscribe(s => seen.push(s.instance_max_count));
    TestBed.tick();
    expect(seen).toEqual([]);

    policy.set(saved);
    loading.set(false);
    TestBed.tick();
    expect(seen).toEqual([7]);
  });

  it('emits the defaults once the load finds no policy', () => {
    const service = TestBed.inject(EditAutoscalerPolicyService);
    const seen: number[] = [];
    service.updateFromStore('app', 'cf');
    service.getState().subscribe(s => seen.push(s.instance_max_count));
    TestBed.tick();
    loading.set(false);
    TestBed.tick();
    expect(seen).toEqual([10]);
  });

  // Step 1 runs updateFromStore each time it is entered; going back to it
  // reloaded the saved policy over the edits made in later steps.
  it('loads the saved policy only once', () => {
    const service = TestBed.inject(EditAutoscalerPolicyService);
    service.updateFromStore('app', 'cf');
    policy.set(saved);
    loading.set(false);
    TestBed.tick();
    service.setState({ ...saved, instance_max_count: 3 } as any);

    service.updateFromStore('app', 'cf');
    TestBed.tick();
    let max = 0;
    service.getState().subscribe(s => max = s.instance_max_count);
    expect(loads).toBe(1);
    expect(max).toBe(3);
  });
});
