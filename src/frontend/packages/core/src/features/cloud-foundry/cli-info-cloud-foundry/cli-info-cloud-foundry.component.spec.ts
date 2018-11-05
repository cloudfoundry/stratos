import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CliInfoCloudFoundryComponent } from './cli-info-cloud-foundry.component';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../../shared/shared.module';
import { CoreModule } from '../../../core/core.module';
import { MDAppModule } from '../../../core/md.module';
import { BaseTestModules, generateTestCfEndpointServiceProvider } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';

describe('CliInfoCloudFoundryComponent', () => {
  let component: CliInfoCloudFoundryComponent;
  let fixture: ComponentFixture<CliInfoCloudFoundryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CliInfoCloudFoundryComponent ],
      imports: [...BaseTestModules],
      providers: [
        CloudFoundryEndpointService,
        generateTestCfEndpointServiceProvider(),
        ActiveRouteCfOrgSpace
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
