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
import { ApplicationService } from '../../application.service';
import { ApplicationEnvVarsService } from './application-env-vars.service';
import { ApplicationStateService } from './application-state/application-state.service';
import { SummaryTabComponent } from './summary-tab.component';
import { ViewBuildpackComponent } from './view-buildpack/view-buildpack.component';
import { APIResource } from '../../../../store/types/api.types';

describe('SummaryTabComponent', () => {
  let component: SummaryTabComponent;
  let fixture: ComponentFixture<SummaryTabComponent>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SummaryTabComponent,
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
        ApplicationService,
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
    applicationService.SetApplication(cfGuid, appGuid);
    fixture = TestBed.createComponent(SummaryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
