import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryOrganizationsComponent } from './cloud-foundry-organizations.component';

describe('CloudFoundryOrganizationsComponent', () => {
  let component: CloudFoundryOrganizationsComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFoundryOrganizationsComponent ]
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
