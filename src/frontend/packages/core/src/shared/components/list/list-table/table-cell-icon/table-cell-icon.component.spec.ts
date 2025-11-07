import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule } from '../../../../../core/core.module';
import { TableCellIconComponent } from './table-cell-icon.component';

describe('TableCellIconComponent', () => {
  let component: TableCellIconComponent;
  let fixture: ComponentFixture<TableCellIconComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      providers: [provideZonelessChangeDetection()],
      
      imports: [
        CoreModule,
        TableCellIconComponent,
      ]
    
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellIconComponent);
    component = fixture.componentInstance;
    component.row = true;
    component.config = {
      getIcon: (row) => ({
        icon: ''
      }),
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
