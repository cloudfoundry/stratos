import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { ServicesWallService } from '../../../../../../features/services/services/services-wall.service';
import { BaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';
import { ServiceInstanceCardComponent } from './service-instance-card.component';

describe('ServiceInstanceCardComponent', () => {
  let component: ServiceInstanceCardComponent;
  let fixture: ComponentFixture<ServiceInstanceCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BaseTestModules,
        createBasicStoreModule(),
      ],
      providers: [
        ServicesWallService,
        EntityServiceFactory,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        ServiceActionHelperService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceInstanceCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        service_plan_guid: 'test',
        space_guid: '',
        dashboard_url: '',
        type: '',
        tags: [],
        service_guid: '',
        service_plan_url: '',
        service_bindings: [],
        service_bindings_url: '',
        service_keys_url: '',
        last_operation: {
          type: '',
          state: '',
          description: '',
          updated_at: '',
          created_at: ''
        },
        service_plan: {
          entity: {
            name: '',
            free: true,
            description: '',
            service_guid: '',
            extra: '',
            unique_id: '',
            public: false,
            bindable: 0,
            active: false,
            service_url: '',
            service_instances_url: '',
          },
          metadata: {
            created_at: '',
            guid: '',
            updated_at: '',
            url: ''
          }
        },
        routes_url: '',
        service_url: ''
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
