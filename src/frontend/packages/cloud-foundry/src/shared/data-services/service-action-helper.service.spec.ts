import { inject, TestBed } from '@angular/core/testing';

import { ConfirmationDialogService } from '../../../../core/src/shared/components/confirmation-dialog.service';
import { BaseTestModules } from '../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { ServiceActionHelperService } from './service-action-helper.service';

describe('ServiceActionHelperService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServiceActionHelperService, ConfirmationDialogService],
      imports: [...BaseTestModules]
    });
  });

  it('should be created', inject([ServiceActionHelperService], (service: ServiceActionHelperService) => {
    expect(service).toBeTruthy();
  }));
});
