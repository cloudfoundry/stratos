import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModules } from '../../../../../core/test-framework/core-test.helper';
import type { AnalysisReport } from '../../store/kube.types';
import { AnalysisStatusCellComponent } from './analysis-status-cell.component';

describe('AnalysisStatusCellComponent', () => {
  let component: AnalysisStatusCellComponent;
  let fixture: ComponentFixture<AnalysisStatusCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        AnalysisStatusCellComponent,
        ...BaseTestModules,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisStatusCellComponent);
    component = fixture.componentInstance;
    // Set required row property (inherited from TableCellCustom),
    component.row = {
      id: 'test-id',
      endpoint: 'test-endpoint',
      type: 'test-type',
      name: 'test-name',
      path: '/test/path',
      created: new Date(),
      read: false,
      status: 'completed',
      duration: 1000
    } as AnalysisReport;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
