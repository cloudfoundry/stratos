import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppActionMonitorComponent } from './app-action-monitor.component';
import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('AppActionMonitorComponent', () => {
  let component: AppActionMonitorComponent<any>;
  let fixture: ComponentFixture<AppActionMonitorComponent<any>>;

  beforeEach(async(() => {
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
