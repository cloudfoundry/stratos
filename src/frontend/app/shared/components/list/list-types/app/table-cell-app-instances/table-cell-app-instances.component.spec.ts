import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellAppInstancesComponent } from './table-cell-app-instances.component';
import { CoreModule } from '../../../../../../core/core.module';
import { RunningInstancesComponent } from '../../../../running-instances/running-instances.component';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';

describe('TableCellAppInstancesComponent', () => {
  let component: TableCellAppInstancesComponent<any>;
  let fixture: ComponentFixture<TableCellAppInstancesComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellAppInstancesComponent,
        RunningInstancesComponent
      ],
      imports: [
        CoreModule,
        createBasicStoreModule(),
      ],
      providers: [
        PaginationMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAppInstancesComponent);
    component = fixture.componentInstance;
    component.row = { entity: {}, metadata: {} };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
