import { inject, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material';
import { of } from 'rxjs';

import { CoreModule } from './core/core.module';
import { LoggedInService } from './logged-in.service';
import { createBasicStoreModule } from './test-framework/store-test-helper';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('LoggedInService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoggedInService,
      ],
      imports: [
        CoreModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([LoggedInService], (service: LoggedInService) => {
    expect(service).toBeTruthy();
  }));
});
