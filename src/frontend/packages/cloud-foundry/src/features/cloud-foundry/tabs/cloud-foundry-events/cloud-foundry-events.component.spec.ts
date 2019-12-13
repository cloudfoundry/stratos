import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryEventsComponent } from './cloud-foundry-events.component';

describe('CloudFoundryEventsComponent', () => {
  let component: CloudFoundryEventsComponent;
  let fixture: ComponentFixture<CloudFoundryEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFoundryEventsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
