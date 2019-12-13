import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryOrganizationEventsComponent } from './cloud-foundry-organization-events.component';

describe('CloudFoundryOrganizationEventsComponent', () => {
  let component: CloudFoundryOrganizationEventsComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFoundryOrganizationEventsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
