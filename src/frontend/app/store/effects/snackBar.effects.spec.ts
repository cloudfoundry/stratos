import { MatDialog } from '@angular/material';
import { ShowSnackBar } from './../actions/snackBar.actions';
import { AppState } from '../app-state';
import { AppStoreModule } from './../store.module';
import { EndpointsPageComponent } from '../../features/endpoints/endpoints-page/endpoints-page.component';
import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../reducers.module';
import { Store } from '@ngrx/store';

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
