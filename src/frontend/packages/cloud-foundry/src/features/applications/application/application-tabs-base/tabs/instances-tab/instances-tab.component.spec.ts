import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { testSCFEndpointGuid } from '@stratos/store/testing';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { CF_GUID } from '../../../../../../../../core/src/shared/entity.tokens';
import { SharedModule } from '../../../../../../../../core/src/shared/shared.module';
import { ApplicationServiceMock } from '../../../../../../../../core/test-framework/application-service-helper';
import { AppStoreModule } from '../../../../../../../../store/src/store.module';
import {
  generateCfStoreModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryComponentsModule } from '../../../../../../shared/components/components.module';
import { ApplicationStateService } from '../../../../../../shared/services/application-state.service';
import { ApplicationService } from '../../../../application.service';
import { ApplicationEnvVarsHelper } from '../build-tab/application-env-vars.service';
import { InstancesTabComponent } from './instances-tab.component';

describe('InstancesTabComponent', () => {
  let component: InstancesTabComponent;
  let fixture: ComponentFixture<InstancesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InstancesTabComponent],
      imports: [
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        CloudFoundryComponentsModule
      ],
      providers: [
        generateTestCfEndpointServiceProvider(),
        {
          provide: CF_GUID,
          useValue: testSCFEndpointGuid,
        },
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        AppStoreModule,
        ApplicationStateService,
        ApplicationEnvVarsHelper,
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
