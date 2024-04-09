import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationDeploySourceTypes } from '../../applications/deploy-application/deploy-application-steps.types';
import { CFHomeCardComponent } from './cfhome-card.component';

describe('CFHomeCardComponent', () => {
  let component: CFHomeCardComponent;
  let fixture: ComponentFixture<CFHomeCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CFHomeCardComponent ],
      imports: generateCfBaseTestModules(),
      providers: [
        ApplicationDeploySourceTypes
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CFHomeCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
