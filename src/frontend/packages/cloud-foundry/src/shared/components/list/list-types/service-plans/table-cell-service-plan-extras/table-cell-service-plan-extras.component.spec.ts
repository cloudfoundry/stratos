import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { StoreModule } from '@ngrx/store';

import { PaginationMonitorFactory } from '@stratosui/store/monitors/pagination-monitor.factory';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ApplicationStateService } from '../../../../../services/application-state.service';
import { TableCellAServicePlanExtrasComponent } from "./table-cell-service-plan-extras.component";
describe('TableCellAServicePlanExtrasComponent', () => {
  let component: TableCellAServicePlanExtrasComponent;
  let fixture: ComponentFixture<TableCellAServicePlanExtrasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellAServicePlanExtrasComponent,
        StoreModule,
        ...generateCfStoreModules(),
      ],
      providers: [
        ApplicationStateService,
        PaginationMonitorFactory,
        provideZonelessChangeDetection(),
      ],
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
