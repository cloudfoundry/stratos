import { EntityRequestState } from '../../../../store/reducers/api-request-reducer';
import { Observable } from 'rxjs/Rx';
import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { appReducers } from '../../../../store/reducers.module';
import { AppStoreModule } from '../../../../store/store.module';
import { getInitialTestStoreState } from '../../../../test-framework/store-test-helper';
import { BuildTabComponent } from './build-tab.component';
import { ViewBuildpackComponent } from './view-buildpack/view-buildpack.component';
import { ApplicationService } from '../../application.service';
import { ApplicationServiceMock } from '../../../../test-framework/application-service-helper';
import { ApplicationStateService } from './application-state/application-state.service';
import { ApplicationEnvVarsService } from './application-env-vars.service';
import { APIResource } from '../../../../store/types/api.types';

describe('SummaryTabComponent', () => {
  let component: BuildTabComponent;
  let fixture: ComponentFixture<BuildTabComponent>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        BuildTabComponent,
        ViewBuildpackComponent
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
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        AppStoreModule,
        ApplicationStateService,
        ApplicationEnvVarsService
      ]
    })
      .compileComponents();
  }));

  beforeEach(inject([ApplicationService], (applicationService: ApplicationService) => {
    const cfGuid = initialState.cnsis.entities[0].guid;
    const appGuid = (Object.values(initialState.entities.application)[0] as APIResource).metadata.guid;
    applicationService.setApplication(cfGuid, appGuid);
    fixture = TestBed.createComponent(BuildTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
