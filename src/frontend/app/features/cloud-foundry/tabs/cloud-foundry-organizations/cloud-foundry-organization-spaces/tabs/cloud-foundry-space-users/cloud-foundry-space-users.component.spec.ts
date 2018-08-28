import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationServiceMock,
} from '../../../../../../../test-framework/cloud-foundry-organization.service.mock';
import { CloudFoundrySpaceServiceMock } from '../../../../../../../test-framework/cloud-foundry-space.service.mock';
import { ActiveRouteCfOrgSpace } from '../../../../../cf-page.types';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CloudFoundrySpaceUsersComponent } from './cloud-foundry-space-users.component';

describe('CloudFoundrySpaceUsersComponent', () => {
  let component: CloudFoundrySpaceUsersComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceUsersComponent],
      imports: [...BaseTestModules],
      providers: [
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        ActiveRouteCfOrgSpace,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
