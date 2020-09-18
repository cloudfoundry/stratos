import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BooleanIndicatorComponent,
} from '../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { BaseTestModulesNoShared } from '../../../../../core/test-framework/core-test.helper';
import { ServiceInstanceLastOpComponent } from './service-instance-last-op.component';

describe('ServiceInstanceLastOpComponent', () => {
  let component: ServiceInstanceLastOpComponent;
  let fixture: ComponentFixture<ServiceInstanceLastOpComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ServiceInstanceLastOpComponent,
        BooleanIndicatorComponent,
      ],
      imports: [...BaseTestModulesNoShared]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceInstanceLastOpComponent);
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
