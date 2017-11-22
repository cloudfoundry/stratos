import { AppState } from '../../../../store/app-state';
import { EntityService } from '../../../../core/entity-service';
import { ApplicationSchema, GetApplication } from '../../../../store/actions/application.actions';
import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { getInitialTestStoreState } from '../../../../test-framework/store-test-helper';
import { paginationReducer } from '../../../../store/reducers/pagination.reducer';
import { entitiesReducer } from '../../../../store/reducers/entity.reducer';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '../../../../shared/shared.module';
import { ApplicationEnvVarsService } from '../summary-tab/application-env-vars.service';
import { ApplicationStateService } from '../summary-tab/application-state/application-state.service';
import { AppStoreModule } from '../../../../store/store.module';
import { ApplicationService } from '../../application.service';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { MDAppModule } from '../../../../core/md.module';
import { LogViewerComponent } from '../../../../shared/components/log-viewer/log-viewer.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../core/core.module';
import { LogStreamTabComponent } from './log-stream-tab.component';

const appId = '1';
const cfId = '2';
const entityServiceFactory = (
  store: Store<AppState>
) => {
  return new EntityService(
    store,
    ApplicationSchema.key,
    ApplicationSchema,
    appId,
    new GetApplication(appId, cfId)
  );
};

describe('LogStreamTabComponent', () => {
  let component: LogStreamTabComponent;
  let fixture: ComponentFixture<LogStreamTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule,
        CoreModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        MDAppModule,
        StoreModule.forRoot({
          entities: entitiesReducer,
          pagination: paginationReducer,
        }, {
            initialState: getInitialTestStoreState()
          })
      ],
      declarations: [
        LogViewerComponent,
        LogStreamTabComponent
      ],
      providers: [
        {
          provide: EntityService,
          useFactory: entityServiceFactory,
          deps: [Store]
        },
        ApplicationService,
        AppStoreModule,
        ApplicationStateService,
        ApplicationEnvVarsService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogStreamTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
