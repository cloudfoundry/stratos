import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { CFBaseTestModules } from '../../../../../../cloud-foundry/test-framework/cf-test-helper';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';
import { EditSpaceQuotaStepComponent } from './edit-space-quota-step.component';

describe('EditSpaceQuotaStepComponent', () => {
  let component: EditSpaceQuotaStepComponent;
  let fixture: ComponentFixture<EditSpaceQuotaStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditSpaceQuotaStepComponent, SpaceQuotaDefinitionFormComponent],
      imports: [
        ...CFBaseTestModules
      ],
      providers: [
        PaginationMonitorFactory, {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                quotaId: 'quotaId',
                endpointId: 'endpointId'
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
    fixture = TestBed.createComponent(EditSpaceQuotaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
