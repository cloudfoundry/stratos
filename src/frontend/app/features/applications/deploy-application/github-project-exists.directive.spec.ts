import { GithubProjectExistsDirective } from './github-project-exists.directive';
import { Store, StoreModule } from '@ngrx/store';
import { inject, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { AppState } from '../../../store/app-state';


describe('GithubProjectExistsDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
      ]
    });
  });
  it('should create an instance',  inject([Store], (store: Store<AppState>) => {
    const directive = new GithubProjectExistsDirective(store);
    expect(directive).toBeTruthy();
  }));
});
