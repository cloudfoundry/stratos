import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../core/core.module';
import { MDAppModule } from '../../../../../../core/md.module';
import { SharedModule } from '../../../../../../shared/shared.module';
import { appReducers } from '../../../../../../store/reducers.module';
import { ApplicationServiceMock } from '../../../../../../test-framework/application-service-helper';
import { getInitialTestStoreState } from '../../../../../../test-framework/store-test-helper';
import { ApplicationService } from '../../../../application.service';
import { ApplicationEnvVarsService } from '../build-tab/application-env-vars.service';
import { ApplicationStateService } from '../../../../../../shared/components/application-state/application-state.service';
import { VariablesTabComponent } from './variables-tab.component';

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
        BrowserAnimationsModule,
        StoreModule.forRoot(appReducers, {
          initialState: getInitialTestStoreState()
        })
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
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
