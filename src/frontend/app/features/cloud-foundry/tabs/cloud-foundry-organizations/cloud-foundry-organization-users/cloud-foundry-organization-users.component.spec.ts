import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryOrganizationUsersComponent } from './cloud-foundry-organization-users.component';

describe('CloudFoundryOrganizationUsersComponent', () => {
  let component: CloudFoundryOrganizationUsersComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFoundryOrganizationUsersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
