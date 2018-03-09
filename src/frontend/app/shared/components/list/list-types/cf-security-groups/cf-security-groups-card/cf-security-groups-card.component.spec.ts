import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  getBaseTestModulesNoShared,
  getMetadataCardComponents,
  generateTestCfEndpointService,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfSecurityGroupsCardComponent } from './cf-security-groups-card.component';
import { SecurityRuleComponent } from './security-rule/security-rule.component';
import { BooleanIndicatorComponent } from '../../../../boolean-indicator/boolean-indicator.component';

describe('CfSecurityGroupsCardComponent', () => {
  let component: CfSecurityGroupsCardComponent;
  let fixture: ComponentFixture<CfSecurityGroupsCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CfSecurityGroupsCardComponent, getMetadataCardComponents, SecurityRuleComponent, BooleanIndicatorComponent],
      imports: [...getBaseTestModulesNoShared],
      providers: [generateTestCfEndpointService()]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfSecurityGroupsCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        name: '',
        rules: [],
        running_default: false,
        staging_default: false,
        spaces_url: '',
        spaces: [],
        staging_spaces_url: ''
      },
      metadata: {
        created_at: '',
        updated_at: '',
        guid: '',
        url: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
