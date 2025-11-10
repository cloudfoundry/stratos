import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { TableCellServiceReferencesComponent } from "./table-cell-service-references.component";

describe('TableCellServiceReferencesComponent', () => {
  let component: TableCellServiceReferencesComponent;
  let fixture: ComponentFixture<TableCellServiceReferencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellServiceReferencesComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellServiceReferencesComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() since the component needs input data
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
