import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PageHeaderEventsComponent } from './page-header-events.component';

describe('PageHeaderEventsComponent', () => {
  let component: PageHeaderEventsComponent;
  let fixture: ComponentFixture<PageHeaderEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PageHeaderEventsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageHeaderEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
