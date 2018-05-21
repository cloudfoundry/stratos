import { TestBed, inject } from '@angular/core/testing';

import { ServiceActionHelperService } from './service-action-helper.service';
import { BaseTestModules } from '../../test-framework/cloud-foundry-endpoint-service.helper';
import { ConfirmationDialogConfig } from '../components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../components/confirmation-dialog.service';

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
