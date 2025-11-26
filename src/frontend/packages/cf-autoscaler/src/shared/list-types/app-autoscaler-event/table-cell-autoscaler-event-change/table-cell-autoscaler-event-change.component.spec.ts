import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import type { APIResource } from '@stratosui/store';
import { TableCellAutoscalerEventChangeIconPipe } from './table-cell-autoscaler-event-change-icon.pipe';
import { TableCellAutoscalerEventChangeComponent } from './table-cell-autoscaler-event-change.component';
import type { AppAutoscalerEvent } from '../../../../store/app-autoscaler.types';

describe('TableCellAutoscalerEventChangeComponent', () => {
  let component: TableCellAutoscalerEventChangeComponent;
  let fixture: ComponentFixture<TableCellAutoscalerEventChangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [TableCellAutoscalerEventChangeComponent, TableCellAutoscalerEventChangeIconPipe]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellAutoscalerEventChangeComponent>(TableCellAutoscalerEventChangeComponent);
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
