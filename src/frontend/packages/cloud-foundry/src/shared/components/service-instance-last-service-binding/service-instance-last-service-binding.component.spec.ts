import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
  BooleanIndicatorComponent,
} from '../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { BaseTestModulesNoShared } from '../../../../../core/test-framework/core-test.helper';
import { ServiceInstanceLastServiceBindingComponent } from './service-instance-last-service-binding.component';

describe('ServiceInstanceLastServiceBindingComponent', () => {
  let component: ServiceInstanceLastServiceBindingComponent;
  let fixture: ComponentFixture<ServiceInstanceLastServiceBindingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        ServiceInstanceLastServiceBindingComponent,
        BooleanIndicatorComponent,
      ],
      imports: [...BaseTestModulesNoShared]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceInstanceLastServiceBindingComponent);
    component = fixture.componentInstance;
    component.serviceInstance = {
      entity: {
        service_plan_guid: '',
        space_guid: '',
        dashboard_url: '',
        type: '',
        service_guid: '',
        service_plan_url: '',
        service_bindings_url: '',
        service_keys_url: '',
        routes_url: '',
        service_url: '',
      },
      metadata: {
        created_at: '',
        guid: '',
        updated_at: '',
        url: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
