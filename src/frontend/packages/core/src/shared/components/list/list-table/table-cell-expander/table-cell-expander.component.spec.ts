import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TableRowExpandedService } from '../table-row/table-row-expanded-service';
import { TableCellExpanderComponent } from './table-cell-expander.component';

describe('TableCellExpanderComponent', () => {
  let component: TableCellExpanderComponent;
  let fixture: ComponentFixture<TableCellExpanderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      
      imports: [
        NoopAnimationsModule,
        TableCellExpanderComponent
      ],
      providers: [
        TableRowExpandedService
      ]
    
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellExpanderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
