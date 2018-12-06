import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';

import { InstancesTabComponent } from './instances-tab.component';
import { CoreModule } from '../../../../../../core/core.module';
import { SharedModule } from '../../../../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../../../../store/reducers.module';
import { ApplicationService } from '../../../../application.service';
import { ApplicationServiceMock } from '../../../../../../test-framework/application-service-helper';
import { AppStoreModule } from '../../../../../../store/store.module';
import { ApplicationStateService } from '../../../../../../shared/components/application-state/application-state.service';
import { ApplicationEnvVarsHelper } from '../build-tab/application-env-vars.service';
import { RouterTestingModule } from '@angular/router/testing';
import { getInitialTestStoreState } from '../../../../../../test-framework/store-test-helper';

describe('InstancesTabComponent', () => {
  let component: InstancesTabComponent;
  let fixture: ComponentFixture<InstancesTabComponent>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InstancesTabComponent],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        AppStoreModule,
        ApplicationStateService,
        ApplicationEnvVarsHelper
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InstancesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
