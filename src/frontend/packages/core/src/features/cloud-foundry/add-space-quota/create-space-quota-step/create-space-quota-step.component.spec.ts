import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { CreateSpaceQuotaStepComponent } from './create-space-quota-step.component';

describe('CreateSpaceQuotaStepComponent', () => {
  let component: CreateSpaceQuotaStepComponent;
  let fixture: ComponentFixture<CreateSpaceQuotaStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateSpaceQuotaStepComponent],
      imports: [...BaseTestModules],
      providers: [PaginationMonitorFactory]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSpaceQuotaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
