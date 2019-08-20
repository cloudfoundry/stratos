import { inject, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../core/src/core/entity-service-factory.service';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { createBasicStoreModule } from '../../../../core/test-framework/store-test-helper';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { EditAutoscalerPolicyService } from './edit-autoscaler-policy-service';

describe('EditAutoscalerPolicyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EditAutoscalerPolicyService,
        EntityServiceFactory,
      ],
      imports: [
        SharedModule,
        createBasicStoreModule(),
        CfAutoscalerTestingModule
      ]
    });
  });

  it('should be created', inject([EditAutoscalerPolicyService], (service: EditAutoscalerPolicyService) => {
    expect(service).toBeTruthy();
  }));
});
