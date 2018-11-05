import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { TableCellServiceNameComponent } from './table-cell-service-name.component';

describe('TableCellServiceNameComponent', () => {
  let component: TableCellServiceNameComponent<any>;
  let fixture: ComponentFixture<TableCellServiceNameComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellServiceNameComponent],
      imports: [...BaseTestModulesNoShared],
      providers: [EntityMonitorFactory]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceNameComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        service_bindings: [],
        active: true,
        bindable: true,
        description: 'test',
        extra: '',
        label: '',
        info_url: '',
        long_description: '',
        plan_updateable: false,
        tags: [],
        url: '',
        version: ''
      },
      metadata: null
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
