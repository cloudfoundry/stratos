import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  CfOrgsListConfigService,
} from '../../../../../../cloud-foundry/src/shared/components/list/list-types/cf-orgs/cf-orgs-list-config.service';
import { CFBaseTestModules } from '../../../../../../cloud-foundry/test-framework/cf-test-helper';
import {
  generateTestCfEndpointServiceProvider,
} from '../../../../../../cloud-foundry/test-framework/cloud-foundry-endpoint-service.helper';
import { TabNavService } from '../../../../../../core/tab-nav.service';
import { CloudFoundryQuotasComponent } from './cloud-foundry-quotas.component';

describe('CloudFoundryQuotasComponent', () => {
  let component: CloudFoundryQuotasComponent;
  let fixture: ComponentFixture<CloudFoundryQuotasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryQuotasComponent],
      providers: [CfOrgsListConfigService, generateTestCfEndpointServiceProvider(), TabNavService, DatePipe],
      imports: [...CFBaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryQuotasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
