import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryOrganizationSpacesComponent } from './cloud-foundry-organization-spaces.component';

describe('CloudFoundryOrganizationSpacesComponent', () => {
  let component: CloudFoundryOrganizationSpacesComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationSpacesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFoundryOrganizationSpacesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationSpacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
