import { TestBed, inject } from '@angular/core/testing';

import { ConfirmationDialogService } from './confirmation-dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { CoreModule } from '../../core/core.module';

describe('ConfirmationDialogService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfirmationDialogService,
        MatDialog,
      ],
      imports: [
        CoreModule,
      ]
    });
  });

  it('should be created', inject([ConfirmationDialogService], (service: ConfirmationDialogService) => {
    expect(service).toBeTruthy();
  }));
});
