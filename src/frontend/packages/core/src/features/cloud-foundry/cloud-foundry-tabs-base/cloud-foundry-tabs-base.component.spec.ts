import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryTabsBaseComponent } from './cloud-foundry-tabs-base.component';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { RouterTestingModule } from '@angular/router/testing';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import {
  generateTestCfEndpointServiceProvider,
  BaseTestModules
} from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  createBasicStoreModule,
  testSCFGuid
} from '../../../test-framework/store-test-helper';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';

describe('CloudFoundryTabsBaseComponent', () => {
  let component: CloudFoundryTabsBaseComponent;
  let fixture: ComponentFixture<CloudFoundryTabsBaseComponent>;
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CloudFoundryTabsBaseComponent],
        imports: [...BaseTestModules],
        providers: [
          CloudFoundryEndpointService,
          generateTestCfEndpointServiceProvider(),
          ActiveRouteCfOrgSpace
        ]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryTabsBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
