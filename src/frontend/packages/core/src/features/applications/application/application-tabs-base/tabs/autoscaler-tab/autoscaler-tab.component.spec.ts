import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../core/core.module';
import { ApplicationStateService } from '../../../../../../shared/components/application-state/application-state.service';
import { SharedModule } from '../../../../../../shared/shared.module';
import { appReducers } from '../../../../../../store/reducers.module';
import { AppStoreModule } from '../../../../../../store/store.module';
import { endpointStoreNames } from '../../../../../../store/types/endpoint.types';
import { ApplicationServiceMock } from '../../../../../../test-framework/application-service-helper';
import { getInitialTestStoreState } from '../../../../../../test-framework/store-test-helper';
import { ApplicationService } from '../../../../application.service';
import { AutoscalerTabComponent } from './autoscaler-tab.component';
import { HttpModule, Http, ConnectionBackend } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { GITHUB_API_URL, getGitHubAPIURL } from '../../../../../../core/github.helpers';

describe('AutoscalerTabComponent', () => {
  let component: AutoscalerTabComponent;
  let fixture: ComponentFixture<AutoscalerTabComponent>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AutoscalerTabComponent,
      ],
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
        HttpModule
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        AppStoreModule,
        ApplicationStateService,
        Http,
        {
          provide: ConnectionBackend,
          useClass: MockBackend
        },
        { provide: GITHUB_API_URL, useValue: null }
      ]
    })
      .compileComponents();
  }));

  beforeEach(inject([ApplicationService], (applicationService: ApplicationService) => {
    const cfGuid = Object.keys(initialState.requestData[endpointStoreNames.type])[0];
    const appGuid = Object.keys(initialState.requestData.application)[0];
    fixture = TestBed.createComponent(AutoscalerTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
