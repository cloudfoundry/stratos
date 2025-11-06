import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  BooleanIndicatorComponent,
} from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { TableCellServiceActiveComponent } from './table-cell-service-active.component';

describe('TableCellServiceActiveComponent', () => {
  let component: TableCellServiceActiveComponent;
  let fixture: ComponentFixture<TableCellServiceActiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCellServiceActiveComponent, BooleanIndicatorComponent, CoreModule]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellServiceActiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
