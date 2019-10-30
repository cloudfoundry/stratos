import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';

import { CoreModule } from '../../../core/src/core/core.module';
import { EndpointsPageComponent } from '../../../core/src/features/endpoints/endpoints-page/endpoints-page.component';
import { SharedModule } from '../../../core/src/shared/shared.module';
import { ShowSnackBar } from './../actions/snackBar.actions';
import { AppStoreModule } from './../store.module';

describe('SnackBarEffect', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EndpointsPageComponent],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        AppStoreModule
      ]
    })
      .compileComponents();
  });

  it('Should open a dialog', () => {
    inject([Store, MatDialog], (store: Store<unknown>, dialog: MatDialog) => {
      store.dispatch(new ShowSnackBar('Test'));
      expect(dialog.openDialogs[0]).toBeDefined();
    });
  });
});
