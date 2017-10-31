import { inject, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';

import { AppState } from '../../../store/app-state';
import { AppStoreModule } from '../../../store/store.module';
import { AppNameUniqueDirective } from './app-name-unique.directive';
import { getInitialTestStoreState } from '../../../test-framework/store-test-helper';
import { appReducers } from '../../../store/reducers.module';
import { RouterTestingModule } from '@angular/router/testing';
import { MdDialogModule } from '@angular/material';

describe('AppNameUniqueDirective', () => {
  const initialState = getInitialTestStoreState();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AppStoreModule,
        RouterTestingModule,
        MdDialogModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
      ]
    });
  });
  it('should create an instance', inject([Store], (store: Store<AppState>) => {
    const directive = new AppNameUniqueDirective(store);
    expect(directive).toBeTruthy();
  }));
});
