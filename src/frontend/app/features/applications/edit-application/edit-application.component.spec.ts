import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectionBackend, Http, HttpModule } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClientModule } from '@angular/common/http';

import { CoreModule } from '../../../core/core.module';
import { ApplicationStateService } from '../../../shared/components/application-state/application-state.service';
import { SharedModule } from '../../../shared/shared.module';
import { GetApplication } from '../../../store/actions/application.actions';
import { applicationSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import {
  ApplicationServiceMock,
  generateTestApplicationServiceProvider,
} from '../../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../test-framework/entity-service.helper';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
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
        BrowserAnimationsModule,
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        RouterTestingModule,
        HttpClientModule,
        HttpClientTestingModule,
        HttpModule
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        generateTestEntityServiceProvider(
          appId,
          entityFactory(applicationSchemaKey),
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
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
