import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppChipsComponent } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { EntityServiceFactory } from '../../../../../../../../store/src/entity-service-factory.service';
import { EntityMonitorFactory } from '../../../../../../../../store/src/monitors/entity-monitor.factory.service';
import {
  generateCfBaseTestModulesNoShared,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { TableCellServiceInstanceAppsAttachedComponent } from './table-cell-service-instance-apps-attached.component';

describe('TableCellServiceInstanceAppsAttachedComponent', () => {
  let component: TableCellServiceInstanceAppsAttachedComponent;
  let fixture: ComponentFixture<TableCellServiceInstanceAppsAttachedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellServiceInstanceAppsAttachedComponent,
        AppChipsComponent
      ],
      imports: [
        generateCfBaseTestModulesNoShared()
      ],
      providers: [
        EntityServiceFactory,
        EntityMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceInstanceAppsAttachedComponent);
    component = fixture.componentInstance;
    component.config = {
      breadcrumbs: ''
    };
    component.row = {
      entity: {
        service_plan_guid: 'service_plan',
        space_guid: 'space',
        dashboard_url: 'dashboard_url',
        type: 'type',
        service_guid: 'service_guid',
        service_plan_url: 'service_plan_url',
        service_bindings_url: 'service_bindings_url',
        service_bindings: [],
        service_keys_url: 'service_keys_url',
        routes_url: 'routes_url',
        service_url: 'service_url',
      },
      metadata: {
        created_at: '',
        guid: 'guid',
        updated_at: '',
        url: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', async(() => {
    expect(component).toBeTruthy();
  }));
});
