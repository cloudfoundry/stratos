import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { generateCfBaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServiceIconComponent } from './service-icon.component';

describe('ServiceIconComponent', () => {
  let component: ServiceIconComponent;
  let fixture: ComponentFixture<ServiceIconComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ServiceIconComponent],
      imports: generateCfBaseTestModulesNoShared()
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
