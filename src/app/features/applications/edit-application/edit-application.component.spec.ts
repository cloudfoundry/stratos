import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';

import { EditApplicationComponent } from './edit-application.component';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { ApplicationStateService } from '../../../shared/components/application-state/application-state.service';
import { ApplicationService } from '../application.service';
import { ApplicationServiceMock, generateTestApplicationServiceProvider } from '../../../test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { generateTestEntityServiceProvider } from '../../../test-framework/entity-service.helper';
import { ApplicationSchema, GetApplication } from '../../../store/actions/application.actions';
import { XHRBackend, ResponseOptions } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { EntityService } from '../../../core/entity-service';
import { ApplicationEnvVarsService } from '../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const appId = '4e4858c4-24ab-4caf-87a8-7703d1da58a0';
const cfId = '01ccda9d-8f40-4dd0-bc39-08eea68e364f';
const applicationRes = {
  entity: {
    name: 'TEST',
    instances: 0,
    memory: 0,
    disk_quota: 0,
    enable_ssh: false,
    production: true
  }
};

describe('EditApplicationComponent', () => {
  let component: EditApplicationComponent;
  let fixture: ComponentFixture<EditApplicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditApplicationComponent ],
      imports: [
        BrowserAnimationsModule,
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        RouterTestingModule,
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        generateTestEntityServiceProvider(
          appId,
          ApplicationSchema,
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsService
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
