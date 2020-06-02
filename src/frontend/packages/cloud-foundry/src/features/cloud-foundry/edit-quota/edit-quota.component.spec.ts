import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { TabNavService } from '../../../../../core/tab-nav.service';
import { CFBaseTestModules } from '../../../../test-framework/cf-test-helper';
import { QuotaDefinitionFormComponent } from '../quota-definition-form/quota-definition-form.component';
import { EditQuotaStepComponent } from './edit-quota-step/edit-quota-step.component';
import { EditQuotaComponent } from './edit-quota.component';

describe('EditQuotaComponent', () => {
  let component: EditQuotaComponent;
  let fixture: ComponentFixture<EditQuotaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditQuotaComponent, EditQuotaStepComponent, QuotaDefinitionFormComponent],
      imports: [...CFBaseTestModules],
      providers: [
        TabNavService, {
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
    fixture = TestBed.createComponent(EditQuotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
