import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { SpecifyDetailsStepComponent } from './specify-details-step.component';
import { CsiGuidsService } from '../csi-guids.service';

describe('SpecifyDetailsStepComponent', () => {
  let component: SpecifyDetailsStepComponent;
  let fixture: ComponentFixture<SpecifyDetailsStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SpecifyDetailsStepComponent],
      imports: [BaseTestModules],
      providers: [
        CreateServiceInstanceHelperServiceFactory,
        CsiGuidsService
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
