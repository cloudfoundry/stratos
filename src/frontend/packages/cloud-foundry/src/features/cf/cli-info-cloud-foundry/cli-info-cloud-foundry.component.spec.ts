import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../core/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CliCommandComponent } from '../../../shared/components/cli-info/cli-command/cli-command.component';
import { CliInfoComponent } from '../../../shared/components/cli-info/cli-info.component';
import { CfUserPermissionDirective } from '../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import { ApplicationStateService } from '../../../shared/services/application-state.service';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CliInfoCloudFoundryComponent } from './cli-info-cloud-foundry.component';

describe('CliInfoCloudFoundryComponent', () => {
  let component: CliInfoCloudFoundryComponent;
  let fixture: ComponentFixture<CliInfoCloudFoundryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CliInfoCloudFoundryComponent,
        CliInfoComponent,
        CliCommandComponent,
        CfUserPermissionDirective
      ],
      imports: generateCfBaseTestModules(),
      providers: [
        generateTestCfEndpointServiceProvider(),
        ActiveRouteCfOrgSpace,
        ApplicationStateService,
        CloudFoundryUserProvidedServicesService,
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CliInfoCloudFoundryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
