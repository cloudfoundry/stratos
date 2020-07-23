import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../core/tab-nav.service';
import { generateCfBaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { LongRunningCfOperationsService } from '../../../shared/data-services/long-running-cf-op.service';
import { QuotaDefinitionFormComponent } from '../quota-definition-form/quota-definition-form.component';
import { AddQuotaComponent } from './add-quota.component';
import { CreateQuotaStepComponent } from './create-quota-step/create-quota-step.component';

describe('AddQuotaComponent', () => {
  let component: AddQuotaComponent;
  let fixture: ComponentFixture<AddQuotaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddQuotaComponent, CreateQuotaStepComponent, QuotaDefinitionFormComponent],
      imports: [...generateCfBaseTestModules()],
      providers: [TabNavService, LongRunningCfOperationsService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddQuotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
