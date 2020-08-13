import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { endpointEntityType, stratosEntityFactory } from '../../../../../../../store/src/helpers/stratos-entity-factory';
import { BaseTestModules } from '../../../../../../test-framework/core-test.helper';
import { AppMonitorComponentTypes } from '../../../app-action-monitor-icon/app-action-monitor-icon.component';
import { TableCellRequestMonitorIconComponent } from './table-cell-request-monitor-icon.component';

describe('TableCellRequestMonitorIconComponent', () => {
  let component: TableCellRequestMonitorIconComponent;
  let fixture: ComponentFixture<TableCellRequestMonitorIconComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BaseTestModules,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellRequestMonitorIconComponent);
    component = fixture.componentInstance;
    component.id = '1';
    component.config = () => ({
      entityKey: '',
      schema: stratosEntityFactory(endpointEntityType),
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
