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
    component.row = { entity: {}, metadata: {} };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
