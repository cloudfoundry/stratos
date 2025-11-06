import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  generateCfBaseTestModulesNoShared,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { LongRunningCfOperationsService } from '../../../../../data-services/long-running-cf-op.service';
import { TableCellServiceReferencesComponent } from './table-cell-service-references.component';

describe('TableCellServiceReferencesComponent', () => {
  let component: TableCellServiceReferencesComponent;
  let fixture: ComponentFixture<TableCellServiceReferencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellServiceReferencesComponent,
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

    fixture = TestBed.createComponent(TableCellServiceReferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
