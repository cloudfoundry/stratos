import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateTestCfEndpointServiceProvider,
  getBaseTestModules,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryOrganizationBaseComponent } from './cloud-foundry-organization-base.component';

describe('CloudFoundryOrganizationBaseComponent', () => {
  let component: CloudFoundryOrganizationBaseComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrganizationBaseComponent],
      imports: [...getBaseTestModules],
      providers: [...generateTestCfEndpointServiceProvider()]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
