import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { UtilsService } from '@stratosui/core';
import { UsageGaugeComponent } from '@stratosui/core';
import { PercentagePipe } from '@stratosui/core';
import type { EntityInfo } from '@stratosui/store';
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
