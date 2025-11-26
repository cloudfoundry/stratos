import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import type { APIResource } from '@stratosui/store';
import { TableCellAutoscalerEventStatusIconPipe } from './table-cell-autoscaler-event-status-icon.pipe';
import { TableCellAutoscalerEventStatusComponent } from './table-cell-autoscaler-event-status.component';
import type { AppAutoscalerEvent } from '../../../../store/app-autoscaler.types';

describe('TableCellAutoscalerEventStatusComponent', () => {
  let component: TableCellAutoscalerEventStatusComponent;
  let fixture: ComponentFixture<TableCellAutoscalerEventStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [TableCellAutoscalerEventStatusComponent, TableCellAutoscalerEventStatusIconPipe]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellAutoscalerEventStatusComponent>(TableCellAutoscalerEventStatusComponent);
    component = fixture.componentInstance;
    component.row = {
      metadata: {
        created_at: '',
        guid: '',
        updated_at: '',
        url: ''
      },
      entity: {
        type: ''
      }
    } as unknown as APIResource<AppAutoscalerEvent>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
