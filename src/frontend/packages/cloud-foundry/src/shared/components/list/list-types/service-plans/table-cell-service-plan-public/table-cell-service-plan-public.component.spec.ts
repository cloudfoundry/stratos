import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { StoreModule } from '@ngrx/store';

import { EntityMonitorFactory } from '../../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesService } from '../../../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../../../features/service-catalog/services.service.mock';
import { ServicePlanPublicComponent } from '../../../../service-plan-public/service-plan-public.component';
import { TableCellAServicePlanPublicComponent } from './table-cell-service-plan-public.component';

describe('TableCellAServicePlanPublicComponent', () => {
  let component: TableCellAServicePlanPublicComponent;
  let fixture: ComponentFixture<TableCellAServicePlanPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellAServicePlanPublicComponent,
        ServicePlanPublicComponent
      ,
      imports: [
        StoreModule,
        generateCfStoreModules()
      ],
      providers: [
        EntityMonitorFactory,
        { provide: ServicesService, useClass: ServicesServiceMock },
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
