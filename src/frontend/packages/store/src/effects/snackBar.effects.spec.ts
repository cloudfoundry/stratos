import { MatDialog } from '@angular/material';
import { ShowSnackBar } from './../actions/snackBar.actions';
import { AppState } from '../app-state';
import { AppStoreModule } from './../store.module';
import { Store } from '@ngrx/store';
import { async } from 'q';
import { TestBed, inject } from '@angular/core/testing';
import { EndpointsPageComponent } from '../../../core/src/features/endpoints/endpoints-page/endpoints-page.component';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/src/core/core.module';
import { SharedModule } from '../../../core/src/shared/shared.module';

describe('SnackBarEffect', () => {
  beforeEach(async(() => {
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
  }));

  it('Should open a dialog', () => {
    inject([Store, MatDialog], (store: Store<AppState>, dialog: MatDialog) => {
      store.dispatch(new ShowSnackBar('Test'));
      expect(dialog.openDialogs[0]).toBeDefined();
    });
  });
});
