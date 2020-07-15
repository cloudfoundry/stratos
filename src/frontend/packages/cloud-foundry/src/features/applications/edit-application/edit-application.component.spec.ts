import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../core/tab-nav.service';
import {
  ApplicationServiceMock,
  generateTestApplicationServiceProvider,
} from '../../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationStateService } from '../../../shared/services/application-state.service';
import { ApplicationService } from '../application.service';
import { ApplicationEnvVarsHelper } from '../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { EditApplicationComponent } from './edit-application.component';

const appId = '4e4858c4-24ab-4caf-87a8-7703d1da58a0';
const cfId = '01ccda9d-8f40-4dd0-bc39-08eea68e364f';

describe('EditApplicationComponent', () => {
  let component: EditApplicationComponent;
  let fixture: ComponentFixture<EditApplicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditApplicationComponent],
      imports: [
        ...generateCfStoreModules(),
        NoopAnimationsModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
