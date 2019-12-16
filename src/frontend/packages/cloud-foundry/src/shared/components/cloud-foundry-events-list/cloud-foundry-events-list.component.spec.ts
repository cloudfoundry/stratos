import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryEventsListComponent } from './cloud-foundry-events-list.component';

describe('CloudFoundryEventsListComponent', () => {
  let component: CloudFoundryEventsListComponent;
  let fixture: ComponentFixture<CloudFoundryEventsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFoundryEventsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryEventsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
