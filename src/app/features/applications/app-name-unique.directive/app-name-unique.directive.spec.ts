import { inject, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import { AppState } from '../../../store/app-state';
import { AppStoreModule } from '../../../store/store.module';
import { AppNameUniqueDirective } from './app-name-unique.directive';

describe('AppNameUniqueDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AppStoreModule
      ]
    });
  });
  it('should create an instance', inject([Store], (store: Store<AppState>) => {
    const directive = new AppNameUniqueDirective(store);
    expect(directive).toBeTruthy();
  }));
});
