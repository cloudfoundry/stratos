import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  BooleanIndicatorComponent,
} from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import {
  generateCfBaseTestModulesNoShared,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { LongRunningCfOperationsService } from '../../../../../data-services/long-running-cf-op.service';
import { TableCellServiceBindableComponent } from './table-cell-service-bindable.component';

describe('TableCellServiceBindableComponent', () => {
  let component: TableCellServiceBindableComponent;
  let fixture: ComponentFixture<TableCellServiceBindableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellServiceBindableComponent,
        BooleanIndicatorComponent
      ,
      imports: [
        generateCfBaseTestModulesNoShared()
      ],
      providers: [
        
        LongRunningCfOperationsService
      ,
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellServiceBindableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
