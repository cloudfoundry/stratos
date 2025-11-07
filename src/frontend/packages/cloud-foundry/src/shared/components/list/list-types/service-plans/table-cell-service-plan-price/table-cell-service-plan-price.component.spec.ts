import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { StoreModule } from '@ngrx/store';

import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServicePlanPriceComponent } from '../../../../service-plan-price/service-plan-price.component';
import { TableCellAServicePlanPriceComponent } from "./table-cell-service-plan-price.component";
describe('TableCellAServicePlanPriceComponent', () => {
  let component: TableCellAServicePlanPriceComponent;
  let fixture: ComponentFixture<TableCellAServicePlanPriceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellAServicePlanPriceComponent,
        ServicePlanPriceComponent,
        StoreModule,
        ...generateCfStoreModules(),
      ],
      providers: [provideZonelessChangeDetection()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellAServicePlanPriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
