import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { StoreModule } from '@ngrx/store';

import { PaginationMonitorFactory } from '../../../../../../../../store/src/monitors/pagination-monitor.factory';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationStateService } from '../../../../../services/application-state.service';
import { TableCellAServicePlanExtrasComponent } from './table-cell-service-plan-extras.component';

describe('TableCellAServicePlanExtrasComponent', () => {
  let component: TableCellAServicePlanExtrasComponent;
  let fixture: ComponentFixture<TableCellAServicePlanExtrasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellAServicePlanExtrasComponent,
      imports: [
        StoreModule,
        generateCfStoreModules()
      ],
      providers: [
        ApplicationStateService,
        PaginationMonitorFactory
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellAServicePlanExtrasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
