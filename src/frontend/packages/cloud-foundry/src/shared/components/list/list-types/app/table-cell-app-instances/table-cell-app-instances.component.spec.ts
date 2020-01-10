import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { PaginationMonitorFactory } from '../../../../../../../../store/src/monitors/pagination-monitor.factory';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { RunningInstancesComponent } from '../../../../running-instances/running-instances.component';
import { TableCellAppInstancesComponent } from './table-cell-app-instances.component';

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
        ...generateCfStoreModules(),
        CoreModule,
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
