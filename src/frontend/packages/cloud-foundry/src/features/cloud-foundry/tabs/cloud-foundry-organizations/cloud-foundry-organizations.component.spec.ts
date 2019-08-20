import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../../core/tab-nav.service';
import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgsListConfigService } from '../../../../shared/components/list/list-types/cf-orgs/cf-orgs-list-config.service';
import { CloudFoundryOrganizationsComponent } from './cloud-foundry-organizations.component';

describe('CloudFoundryOrganizationsComponent', () => {
  let component: CloudFoundryOrganizationsComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrganizationsComponent],
      providers: [CfOrgsListConfigService, generateTestCfEndpointServiceProvider(), TabNavService],
      imports: [...BaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
