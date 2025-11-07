import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { UtilsService } from '../../../../../../../../core/src/core/utils.service';
import { TableCellCfCellComponent } from './table-cell-cf-cell.component';

describe('TableCellCfCellComponent', () => {
  let component: TableCellCfCellComponent;
  let fixture: ComponentFixture<TableCellCfCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellCfCellComponent,
      ],
      providers: [
        UtilsService,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TableCellCfCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
