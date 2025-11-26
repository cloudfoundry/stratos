import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { TableCellFeatureFlagDescriptionComponent } from './table-cell-feature-flag-description.component';

describe('TableCellFeatureFlagDescriptionComponent', () => {
  let component: TableCellFeatureFlagDescriptionComponent;
  let fixture: ComponentFixture<TableCellFeatureFlagDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [ TableCellFeatureFlagDescriptionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableCellFeatureFlagDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
