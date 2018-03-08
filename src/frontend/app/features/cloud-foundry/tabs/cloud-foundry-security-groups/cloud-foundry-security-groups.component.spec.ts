import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySecurityGroupsComponent } from './cloud-foundry-security-groups.component';
import { getBaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BaseCF } from '../../cf-page.types';

describe('CloudFoundrySecurityGroupsComponent', () => {
  let component: CloudFoundrySecurityGroupsComponent;
  let fixture: ComponentFixture<CloudFoundrySecurityGroupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySecurityGroupsComponent],
      imports: [...getBaseTestModules],
      providers: [BaseCF]
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
