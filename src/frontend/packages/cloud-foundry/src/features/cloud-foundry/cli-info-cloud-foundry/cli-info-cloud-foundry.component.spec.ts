import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../core/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CliCommandComponent } from '../../../shared/components/cli-info/cli-command/cli-command.component';
import { CliInfoComponent } from '../../../shared/components/cli-info/cli-info.component';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CliInfoCloudFoundryComponent } from './cli-info-cloud-foundry.component';

describe('CliInfoCloudFoundryComponent', () => {
  let component: CliInfoCloudFoundryComponent;
  let fixture: ComponentFixture<CliInfoCloudFoundryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CliInfoCloudFoundryComponent, CliInfoComponent, CliCommandComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        CloudFoundryEndpointService,
        generateTestCfEndpointServiceProvider(),
        ActiveRouteCfOrgSpace,
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
