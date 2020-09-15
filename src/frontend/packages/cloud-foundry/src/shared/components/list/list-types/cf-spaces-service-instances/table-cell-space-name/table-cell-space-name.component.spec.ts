import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateCfBaseTestModulesNoShared,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { TableCellSpaceNameComponent } from './table-cell-space-name.component';

describe('TableCellSpaceNameComponent', () => {
  let component: TableCellSpaceNameComponent;
  let fixture: ComponentFixture<TableCellSpaceNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellSpaceNameComponent],
      imports: generateCfBaseTestModulesNoShared()
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellSpaceNameComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        service_plan_guid: 'test',
        space_guid: '',
        space: {
          entity: {
            name: '',
            organization_guid: '',
            allow_ssh: false,
            organization_url: '',
            developers_url: '',
            managers_url: '',
            auditors_url: '',
            apps_url: '',
            routes_url: '',
            domains_url: '',
            service_instances_url: '',
            app_events_url: '',
            security_groups_url: '',
            staging_security_groups_url: '',
          },
          metadata: {
            created_at: '',
            guid: '',
            updated_at: '',
            url: ''
          }
        },
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
            service: {
              entity: {
                label: '',
                description: '',
                active: 1,
                bindable: 1,
                unique_id: '',
                extra: '',
                tags: [''],
                requires: [''],
                service_broker_guid: '',
                plan_updateable: 1,
                service_plans_url: '',
                service_plans: [],
              },
              metadata: null
            },
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
