import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import { appReducers } from '@stratosui/store';
import { TableCellFeatureFlagStateComponent } from './table-cell-feature-flag-state.component';

describe('TableCellFeatureFlagStateComponent', () => {
  let component: TableCellFeatureFlagStateComponent;
  let fixture: ComponentFixture<TableCellFeatureFlagStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        provideStore(appReducers, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
      ],
      imports: [
        TableCellFeatureFlagStateComponent,
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellFeatureFlagStateComponent);
    component = fixture.componentInstance;
    component.row = {
      name: 'test',
      enabled: true,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
