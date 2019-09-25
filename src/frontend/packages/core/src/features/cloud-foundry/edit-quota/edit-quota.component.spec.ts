import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../tab-nav.service';
import { QuotaDefinitionFormComponent } from '../quota-definition-form/quota-definition-form.component';
import { EditQuotaStepComponent } from './edit-quota-step/edit-quota-step.component';
import { EditQuotaComponent } from './edit-quota.component';
import { CFBaseTestModules } from '../../../../../cloud-foundry/test-framework/cf-test-helper';

describe('EditQuotaComponent', () => {
  let component: EditQuotaComponent;
  let fixture: ComponentFixture<EditQuotaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditQuotaComponent, EditQuotaStepComponent, QuotaDefinitionFormComponent],
      imports: [...CFBaseTestModules],
      providers: [TabNavService]
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
