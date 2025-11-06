import { inject, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createEmptyStoreModule } from "../../test-framework/cf-autoscaler-test.helper";

import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { EntityMonitorFactory } from '../../../../store/src/monitors/entity-monitor.factory.service';
import { EditAutoscalerPolicyService } from './edit-autoscaler-policy-service';

describe('EditAutoscalerPolicyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EditAutoscalerPolicyService,
        EntityServiceFactory,
        EntityMonitorFactory
      ],
      imports: [
        createEmptyStoreModule(),
      ]
    });
  });

  it('should be created', inject([EditAutoscalerPolicyService], (service: EditAutoscalerPolicyService) => {
    expect(service).toBeTruthy();
  }));

  afterAll(() => { });
});
