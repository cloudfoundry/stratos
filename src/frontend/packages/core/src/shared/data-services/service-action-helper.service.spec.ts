import { inject, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ConfirmationDialogService } from '../components/confirmation-dialog.service';
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
