import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BaseTestModulesNoShared,
  MetadataCardTestComponents,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { AppChipsComponent } from '../../../../chips/chips.component';
import { ServiceInstanceCardComponent } from './service-instance-card.component';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { ServicesWallService } from '../../../../../../features/services/services/services-wall.service';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';

describe('ServiceInstanceCardComponent', () => {
  let component: ServiceInstanceCardComponent;
  let fixture: ComponentFixture<ServiceInstanceCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServiceInstanceCardComponent, AppChipsComponent, MetadataCardTestComponents],
      imports: [...BaseTestModulesNoShared],
      providers: [EntityMonitorFactory, PaginationMonitorFactory, ServicesWallService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceInstanceCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        space_guid: '',
        service_plan_guid: '',
        dashboard_url: '',
        type: '',
        service_guid: '',
        service_plan_url: '',
        service_bindings_url: '',
        service_keys_url: '',
        credentials: '',
        routes_url: '',
        service_url: '',
        tags: [],
        service_bindings: []
      },
      metadata: {
        guid: '',
        created_at: '',
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
