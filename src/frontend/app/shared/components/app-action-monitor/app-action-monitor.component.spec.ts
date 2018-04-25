import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppActionMonitorComponent } from './app-action-monitor.component';

describe('AppActionMonitorComponent', () => {
  let component: AppActionMonitorComponent;
  let fixture: ComponentFixture<AppActionMonitorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppActionMonitorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppActionMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
