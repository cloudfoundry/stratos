import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityInfo } from '@stratosui/store/types/api.types';
import { TableCellEventTypeComponent } from './table-cell-event-type.component';

describe('TableCellEventTypeComponent', () => {
  let component: TableCellEventTypeComponent<EntityInfo>;
  let fixture: ComponentFixture<TableCellEventTypeComponent<EntityInfo>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [TableCellEventTypeComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent<TableCellEventTypeComponent<EntityInfo>>(TableCellEventTypeComponent);
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
