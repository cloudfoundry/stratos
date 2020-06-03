import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { CFBaseTestModules } from '../../../../../../cloud-foundry/test-framework/cf-test-helper';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';
import { EditQuotaStepComponent } from './edit-quota-step.component';

describe('EditQuotaStepComponent', () => {
  let component: EditQuotaStepComponent;
  let fixture: ComponentFixture<EditQuotaStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditQuotaStepComponent, QuotaDefinitionFormComponent, QuotaDefinitionFormComponent],
      imports: [...CFBaseTestModules],
      providers: [
        PaginationMonitorFactory, {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                quotaId: 'quotaId',
                cfId: 'cfGuid'
              },
              queryParams: {}
            },
          }
        }
      ]
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
