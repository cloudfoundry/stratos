import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySpaceEventsComponent } from './cloud-foundry-space-events.component';

describe('CloudFoundrySpaceEventsComponent', () => {
  let component: CloudFoundrySpaceEventsComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFoundrySpaceEventsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
