import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { AppChipsComponent } from '../../../../chips/chips.component';
import { TableCellServiceInstanceTagsComponent } from './table-cell-service-instance-tags.component';

describe('TableCellServiceInstanceTagsComponent', () => {
  let component: TableCellServiceInstanceTagsComponent<any>;
  let fixture: ComponentFixture<TableCellServiceInstanceTagsComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellServiceInstanceTagsComponent, AppChipsComponent],
      imports: [...BaseTestModulesNoShared],
      providers: [EntityMonitorFactory]

    })
      .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TableCellServiceInstanceTagsComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
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
        version: '',
        service_instance: {
          entity: {
            tags: []
          }
        }
      },
      metadata: {
        created_at: '',
        guid: '',
        updated_at: '',
        url: ''
      }
    };
    fixture.detectChanges();
  }));

  it('should create', async(() => {
    expect(component).toBeTruthy();
  }));
});
