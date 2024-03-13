import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
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
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { IApp } from '../../../../../../cf-api.types';
import { ApplicationStateService } from '../../../../../services/application-state.service';
import { TableCellAppStatusComponent } from '../table-cell-app-status/table-cell-app-status.component';
import { TableCellAppCfOrgSpaceHeaderComponent } from './table-cell-app-cforgspace-header.component';

describe('TableCellAppCfOrgSpaceHeaderComponent', () => {
  let component: TableCellAppCfOrgSpaceHeaderComponent;
  let fixture: ComponentFixture<TableCellAppCfOrgSpaceHeaderComponent>;

  beforeEach(waitForAsync(() => {
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
    fixture = TestBed.createComponent(TableCellAppCfOrgSpaceHeaderComponent);
    component = fixture.componentInstance;
    component.row = { entity: {}, metadata: {} } as APIResource<IApp>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
