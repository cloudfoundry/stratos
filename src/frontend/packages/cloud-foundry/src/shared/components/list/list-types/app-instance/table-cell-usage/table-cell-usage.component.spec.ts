import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { UtilsService } from '../../../../../../../../core/src/core/utils.service';
import { UsageGaugeComponent } from '../../../../../../../../core/src/shared/components/usage-gauge/usage-gauge.component';
import { PercentagePipe } from '../../../../../../../../core/src/shared/pipes/percentage.pipe';
import { EntityInfo } from '@stratosui/store/types/api.types';
import { TableCellUsageComponent } from './table-cell-usage.component';

describe('TableCellUsageComponent', () => {
  let component: TableCellUsageComponent<EntityInfo>;
  let fixture: ComponentFixture<TableCellUsageComponent<EntityInfo>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellUsageComponent,
        UsageGaugeComponent,
        PercentagePipe,
      ],
      providers: [
        UtilsService,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent<TableCellUsageComponent<EntityInfo>>(TableCellUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
