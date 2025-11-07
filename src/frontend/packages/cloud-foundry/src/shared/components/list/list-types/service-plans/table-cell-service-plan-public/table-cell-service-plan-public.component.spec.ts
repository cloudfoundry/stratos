import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { StoreModule } from '@ngrx/store';

import { EntityMonitorFactory } from '@stratosui/store/monitors/entity-monitor.factory.service';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServicesService } from '../../../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../../../features/service-catalog/services.service.mock';
import { ServicePlanPublicComponent } from '../../../../service-plan-public/service-plan-public.component';
import { TableCellAServicePlanPublicComponent } from './table-cell-service-plan-public.component';
import { EntityServiceFactory } from "@stratosui/store/entity-service-factory.service";
describe('TableCellAServicePlanPublicComponent', () => {
  let component: TableCellAServicePlanPublicComponent;
  let fixture: ComponentFixture<TableCellAServicePlanPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellAServicePlanPublicComponent,
        ServicePlanPublicComponent,
        StoreModule,
        generateCfStoreModules(),
      ],
      providers: [
        EntityServiceFactory,
        
        EntityMonitorFactory,
        { provide: ServicesService, useClass: ServicesServiceMock },

        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellAServicePlanPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
