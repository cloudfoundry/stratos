import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VariablesTabComponent } from './variables-tab.component';
import { MDAppModule } from '../../../../core/md.module';
import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { StoreModule } from '@ngrx/store';
import { ApplicationStateService } from '../summary-tab/application-state/application-state.service';
import { entitiesReducer } from '../../../../store/reducers/entity.reducer';
import { paginationReducer } from '../../../../store/reducers/pagination.reducer';
import { getInitialTestStoreState } from '../../../../test-framework/store-test-helper';
import { ApplicationService } from '../../application.service';
import { ApplicationEnvVarsService } from '../summary-tab/application-env-vars.service';
import { appMetaDataReducer } from '../../../../store/reducers.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('VariablesTabComponent', () => {
  let component: VariablesTabComponent;
  let fixture: ComponentFixture<VariablesTabComponent>;
  let appService: ApplicationService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VariablesTabComponent],
      imports: [
        StoreModule,
        CoreModule,
        SharedModule,
        MDAppModule,
        BrowserAnimationsModule,
        StoreModule.forRoot({
          entities: entitiesReducer,
          pagination: paginationReducer,
          appMetadata: appMetaDataReducer,
        }, {
            initialState: getInitialTestStoreState()
          })
      ],
      providers: [
        ApplicationService,
        ApplicationStateService,
        ApplicationEnvVarsService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VariablesTabComponent);
    component = fixture.componentInstance;

    appService = fixture.debugElement.injector.get(ApplicationService);
    appService.SetApplication('01ccda9d-8f40-4dd0-bc39-08eea68e364f', '4e4858c4-24ab-4caf-87a8-7703d1da58a0');

    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
