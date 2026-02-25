import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityInfo } from '@stratosui/store';
import { TableCellAutoscalerEventChangeIconPipe } from './table-cell-autoscaler-event-change-icon.pipe';
import { TableCellAutoscalerEventChangeComponent } from './table-cell-autoscaler-event-change.component';

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
      entity: {
        type: ''
      }
    } as EntityInfo;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
