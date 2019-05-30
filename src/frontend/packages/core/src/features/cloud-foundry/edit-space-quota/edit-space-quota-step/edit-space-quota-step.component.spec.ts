import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { EditSpaceQuotaStepComponent } from './edit-space-quota-step.component';

describe('EditSpaceQuotaStepComponent', () => {
  let component: EditSpaceQuotaStepComponent;
  let fixture: ComponentFixture<EditSpaceQuotaStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditSpaceQuotaStepComponent],
      imports: [...BaseTestModules],
      providers: [PaginationMonitorFactory]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSpaceQuotaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
