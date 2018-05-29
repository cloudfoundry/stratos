import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellRequestMonitorIconComponent } from './table-cell-request-monitor-icon.component';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { AppMonitorComponentTypes } from '../../../app-action-monitor-icon/app-action-monitor-icon.component';

describe('TableCellRequestMonitorIconComponent', () => {
  let component: TableCellRequestMonitorIconComponent;
  let fixture: ComponentFixture<TableCellRequestMonitorIconComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: BaseTestModules
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellRequestMonitorIconComponent);
    component = fixture.componentInstance;
    component.config = () => ({
      entityKey: '',
      schema: null,
      monitorState: AppMonitorComponentTypes.DELETE
    });
    component.row = {
      metadata: {
        guid: '1'
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
