import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import {
  ApplicationStateIconComponent,
} from '../../../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe,
} from '../../../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.pipe';
import {
  ApplicationStateComponent,
} from '../../../../../../../../core/src/shared/components/application-state/application-state.component';
import { PaginationMonitorFactory } from '../../../../../../../../store/src/monitors/pagination-monitor.factory';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationStateService } from '../../../../../services/application-state.service';
import { TableCellAppStatusComponent } from '../table-cell-app-status/table-cell-app-status.component';

describe('TableCellAppStatusComponent', () => {
  let component: TableCellAppStatusComponent<any>;
  let fixture: ComponentFixture<TableCellAppStatusComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellAppStatusComponent,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe
      ],
      imports: [
        StoreModule,
        CoreModule,
        generateCfStoreModules()
      ],
      providers: [
        ApplicationStateService,
        PaginationMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAppStatusComponent);
    component = fixture.componentInstance;
    component.row = { entity: {}, metadata: {} };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
