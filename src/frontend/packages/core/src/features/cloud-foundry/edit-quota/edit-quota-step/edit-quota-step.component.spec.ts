import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';
import { EditQuotaStepComponent } from './edit-quota-step.component';
import { BaseTestModules } from '../../../../../test-framework/core-test.helper';

describe('EditQuotaStepComponent', () => {
  let component: EditQuotaStepComponent;
  let fixture: ComponentFixture<EditQuotaStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditQuotaStepComponent, QuotaDefinitionFormComponent, QuotaDefinitionFormComponent],
      imports: [...BaseTestModules],
      providers: [PaginationMonitorFactory]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditQuotaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
