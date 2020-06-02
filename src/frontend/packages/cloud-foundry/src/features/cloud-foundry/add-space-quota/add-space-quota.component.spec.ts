import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../core/tab-nav.service';
import { CFBaseTestModules } from '../../../../test-framework/cf-test-helper';
import { SpaceQuotaDefinitionFormComponent } from '../space-quota-definition-form/space-quota-definition-form.component';
import { AddSpaceQuotaComponent } from './add-space-quota.component';
import { CreateSpaceQuotaStepComponent } from './create-space-quota-step/create-space-quota-step.component';

describe('AddSpaceQuotaComponent', () => {
  let component: AddSpaceQuotaComponent;
  let fixture: ComponentFixture<AddSpaceQuotaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddSpaceQuotaComponent, CreateSpaceQuotaStepComponent, SpaceQuotaDefinitionFormComponent],
      imports: [...CFBaseTestModules],
      providers: [TabNavService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSpaceQuotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
