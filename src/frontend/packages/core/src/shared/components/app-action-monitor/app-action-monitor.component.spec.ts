import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BaseTestModules } from '../../../../test-framework/core-test.helper';
import { AppActionMonitorComponent } from './app-action-monitor.component';

describe('AppActionMonitorComponent', () => {
  let component: AppActionMonitorComponent<any>;
  let fixture: ComponentFixture<AppActionMonitorComponent<any>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: BaseTestModules
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
