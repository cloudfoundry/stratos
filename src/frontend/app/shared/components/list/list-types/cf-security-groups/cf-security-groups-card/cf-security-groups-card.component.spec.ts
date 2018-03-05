import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseCF } from '../../../../../../features/cloud-foundry/cf-page.types';
import {
  getBaseTestModulesNoShared,
  getMetadataCardComponents,
  generateTestCfEndpointService,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfSecurityGroupsCardComponent } from './cf-security-groups-card.component';
import { SecurityRuleComponent } from './security-rule/security-rule.component';

describe('CfSecurityGroupsCardComponent', () => {
  let component: CfSecurityGroupsCardComponent;
  let fixture: ComponentFixture<CfSecurityGroupsCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CfSecurityGroupsCardComponent, getMetadataCardComponents, SecurityRuleComponent],
      imports: [...getBaseTestModulesNoShared],
      providers: [BaseCF, generateTestCfEndpointService()]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfSecurityGroupsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
