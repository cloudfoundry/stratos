import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { BooleanIndicatorComponent } from '../../../../boolean-indicator/boolean-indicator.component';
import { ServiceInstanceLastOpComponent } from '../../../../service-instance-last-op/service-instance-last-op.component';
import { TableCellServiceComponent } from './table-cell-service.component';

describe('TableCellServiceComponent', () => {
  let component: TableCellServiceComponent;
  let fixture: ComponentFixture<TableCellServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellServiceComponent,
        ServiceInstanceLastOpComponent,
        BooleanIndicatorComponent
      ],
      imports: [...BaseTestModulesNoShared],
      providers: [EntityMonitorFactory]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceComponent);
    component = fixture.componentInstance;
    component.row = {
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
