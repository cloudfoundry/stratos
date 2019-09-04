import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../tab-nav.service';

import { CloudFoundryQuotasComponent } from './cloud-foundry-quotas.component';
import {
  CfOrgsListConfigService
} from '../../../../../../cloud-foundry/src/shared/components/list/list-types/cf-orgs/cf-orgs-list-config.service';
import {
  generateTestCfEndpointServiceProvider
} from '../../../../../../cloud-foundry/test-framework/cloud-foundry-endpoint-service.helper';
import { BaseTestModules } from '../../../../../test-framework/core-test.helper';

describe('CloudFoundryQuotasComponent', () => {
  let component: CloudFoundryQuotasComponent;
  let fixture: ComponentFixture<CloudFoundryQuotasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryQuotasComponent],
      providers: [CfOrgsListConfigService, generateTestCfEndpointServiceProvider(), TabNavService, DatePipe],
      imports: [...BaseTestModules]
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
