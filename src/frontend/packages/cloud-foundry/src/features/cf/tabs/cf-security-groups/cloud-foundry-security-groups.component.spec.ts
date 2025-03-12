import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundrySecurityGroupsComponent } from './cloud-foundry-security-groups.component';

describe('CloudFoundrySecurityGroupsComponent', () => {
  let component: CloudFoundrySecurityGroupsComponent;
  let fixture: ComponentFixture<CloudFoundrySecurityGroupsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySecurityGroupsComponent],
      imports: generateCfBaseTestModules(),
      providers: [ActiveRouteCfOrgSpace]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySecurityGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
