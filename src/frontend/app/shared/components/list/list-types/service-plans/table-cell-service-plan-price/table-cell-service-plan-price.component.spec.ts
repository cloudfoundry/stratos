import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../core/core.module';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';
import {
  ApplicationStateIconComponent,
} from '../../../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../../../application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateComponent } from '../../../../application-state/application-state.component';
import { ApplicationStateService } from '../../../../application-state/application-state.service';
import { TableCellAServicePlanPriceComponent } from './table-cell-service-plan-price.component';

describe('TableCellAServicePlanPriceComponent', () => {
  let component: TableCellAServicePlanPriceComponent;
  let fixture: ComponentFixture<TableCellAServicePlanPriceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellAServicePlanPriceComponent,
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
    fixture = TestBed.createComponent(TableCellAServicePlanPriceComponent);
    component = fixture.componentInstance;
    component.row = { entity: {}, metadata: {} };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
