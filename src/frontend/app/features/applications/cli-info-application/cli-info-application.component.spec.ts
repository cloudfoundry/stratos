import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CliInfoApplicationComponent } from './cli-info-application.component';
import { CodeBlockComponent } from '../../../shared/components/code-block/code-block.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { MDAppModule } from '../../../core/md.module';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { generateTestEntityServiceProvider } from '../../../test-framework/entity-service.helper';
import { entityFactory, applicationSchemaKey } from '../../../store/helpers/entity-factory';
import { GetApplication } from '../../../store/actions/application.actions';
import { generateTestApplicationServiceProvider } from '../../../test-framework/application-service-helper';
import { ApplicationStateService } from '../../../shared/components/application-state/application-state.service';
import { ApplicationEnvVarsService } from '../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('CliInfoApplicationComponent', () => {
  let component: CliInfoApplicationComponent;
  let fixture: ComponentFixture<CliInfoApplicationComponent>;

  const appId = '1';
  const cfId = '2';

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CliInfoApplicationComponent ],
      imports: [
        CoreModule,
        SharedModule,
        MDAppModule,
        RouterTestingModule,
        createBasicStoreModule()
      ],
      providers: [
        generateTestEntityServiceProvider(
          appId,
          entityFactory(applicationSchemaKey),
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
    fixture = TestBed.createComponent(CliInfoApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
