import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppChipsComponent } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { EntityMonitorFactory } from '../../../../../../../../store/src/monitors/entity-monitor.factory.service';
import {
  generateCfBaseTestModulesNoShared,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { TableCellServiceInstanceTagsComponent } from './table-cell-service-instance-tags.component';

describe('TableCellServiceInstanceTagsComponent', () => {
  let component: TableCellServiceInstanceTagsComponent;
  let fixture: ComponentFixture<TableCellServiceInstanceTagsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellServiceInstanceTagsComponent, AppChipsComponent],
      imports: generateCfBaseTestModulesNoShared(),
      providers: [EntityMonitorFactory]

    })
      .compileComponents();
  }));

  beforeEach(waitForAsync(() => {
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

  it('should create', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));
});
