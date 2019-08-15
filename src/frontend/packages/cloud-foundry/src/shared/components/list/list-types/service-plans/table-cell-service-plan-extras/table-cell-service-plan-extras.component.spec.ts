import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import {
  ApplicationStateService,
} from '../../../../../../../../core/src/shared/components/application-state/application-state.service';
import { PaginationMonitorFactory } from '../../../../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { createBasicStoreModule } from '../../../../../../../../core/test-framework/store-test-helper';
import { TableCellAServicePlanExtrasComponent } from './table-cell-service-plan-extras.component';

describe('TableCellAServicePlanExtrasComponent', () => {
  let component: TableCellAServicePlanExtrasComponent;
  let fixture: ComponentFixture<TableCellAServicePlanExtrasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellAServicePlanExtrasComponent,
      ],
      imports: [
        StoreModule,
        CoreModule,
        createBasicStoreModule()
      ],
      providers: [
        ApplicationStateService,
        PaginationMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAServicePlanExtrasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
