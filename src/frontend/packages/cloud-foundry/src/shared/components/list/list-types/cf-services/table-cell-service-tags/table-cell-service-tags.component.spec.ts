import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { TableCellServiceTagsComponent } from './table-cell-service-tags.component';

describe('TableCellServiceTagsComponent', () => {
  let component: TableCellServiceTagsComponent;
  let fixture: ComponentFixture<TableCellServiceTagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellServiceTagsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellServiceTagsComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() since the component needs input data
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
