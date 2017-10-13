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

describe('VariablesTabComponent', () => {
  let component: VariablesTabComponent;
  let fixture: ComponentFixture<VariablesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VariablesTabComponent],
      imports: [
        StoreModule,
        CoreModule,
        SharedModule,
        MDAppModule,
        StoreModule.forRoot({
          entities: entitiesReducer,
          pagination: paginationReducer,
          appMetadata: appMetaDataReducer,
        }, {
            initialState: {}
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
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
