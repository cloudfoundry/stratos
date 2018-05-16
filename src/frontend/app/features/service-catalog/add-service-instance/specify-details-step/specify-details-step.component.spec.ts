import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesService } from '../../services.service';
import { ServicesServiceMock } from '../../services.service.mock';
import { SpecifyDetailsStepComponent } from './specify-details-step.component';
import { CreateServiceInstanceHelperService } from '../create-service-instance-helper.service';

describe('SpecifyDetailsStepComponent', () => {
  let component: SpecifyDetailsStepComponent;
  let fixture: ComponentFixture<SpecifyDetailsStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SpecifyDetailsStepComponent],
      imports: [BaseTestModules],
      providers: [
        CreateServiceInstanceHelperService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecifyDetailsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
