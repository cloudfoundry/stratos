import { inject, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';

import { AppState } from '../../../store/app-state';
import { AppStoreModule } from '../../../store/store.module';
import { AppNameUniqueDirective } from './app-name-unique.directive';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { RouterTestingModule } from '@angular/router/testing';
import { MdDialogModule } from '@angular/material';

describe('AppNameUniqueDirective', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AppStoreModule,
        RouterTestingModule,
        MdDialogModule,
        createBasicStoreModule(),
      ]
    });
  });
  it('should create an instance', inject([Store], (store: Store<AppState>) => {
    const directive = new AppNameUniqueDirective(store);
    expect(directive).toBeTruthy();
  }));
});
