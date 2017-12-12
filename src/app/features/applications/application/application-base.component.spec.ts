import { appReducers } from '../../../store/reducers.module';
import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../core/core.module';
import { MDAppModule } from '../../../core/md.module';
import { SharedModule } from '../../../shared/shared.module';
import { paginationReducer } from '../../../store/reducers/pagination-reducer/pagination.reducer';
import { getInitialTestStoreState } from '../../../test-framework/store-test-helper';
import { ApplicationBaseComponent } from './application-base.component';
import { ApplicationEnvVarsService } from './build-tab/application-env-vars.service';
import {
  ApplicationStateIconComponent,
} from './build-tab/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe,
} from './build-tab/application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateComponent } from './build-tab/application-state/application-state.component';
import { ApplicationStateService } from './build-tab/application-state/application-state.service';

describe('ApplicationBaseComponent', () => {
  let component: ApplicationBaseComponent;
  let fixture: ComponentFixture<ApplicationBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ApplicationBaseComponent,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe
      ],
      imports: [
        StoreModule,
        CoreModule,
        SharedModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        MDAppModule,
        StoreModule.forRoot(
          appReducers
          , {
            initialState: getInitialTestStoreState()
          })
      ],
      providers: [
        ApplicationStateService,
        ApplicationEnvVarsService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
