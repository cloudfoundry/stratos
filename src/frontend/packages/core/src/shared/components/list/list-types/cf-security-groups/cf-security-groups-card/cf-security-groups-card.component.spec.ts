import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveRouteCfOrgSpace } from '../../../../../../features/cloud-foundry/cf-page.types';
import {
  generateTestCfEndpointService,
  BaseTestModulesNoShared,
  MetadataCardTestComponents,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BooleanIndicatorComponent } from '../../../../boolean-indicator/boolean-indicator.component';
import { AppChipsComponent } from '../../../../chips/chips.component';
import { CfSecurityGroupsCardComponent } from './cf-security-groups-card.component';

describe('CfSecurityGroupsCardComponent', () => {
  let component: CfSecurityGroupsCardComponent;
  let fixture: ComponentFixture<CfSecurityGroupsCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CfSecurityGroupsCardComponent, MetadataCardTestComponents, BooleanIndicatorComponent, AppChipsComponent],
      imports: [...BaseTestModulesNoShared],
      providers: [ActiveRouteCfOrgSpace, generateTestCfEndpointService()]
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
