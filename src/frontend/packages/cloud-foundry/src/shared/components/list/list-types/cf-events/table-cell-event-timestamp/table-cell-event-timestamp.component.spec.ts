import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityInfo } from '../../../../../../../../store/src/types/api.types';
import { TableCellEventTimestampComponent } from './table-cell-event-timestamp.component';

describe('TableCellEventTimestampComponent', () => {
  let component: TableCellEventTimestampComponent<EntityInfo>;
  let fixture: ComponentFixture<TableCellEventTimestampComponent<EntityInfo>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [TableCellEventTimestampComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent<TableCellEventTimestampComponent<EntityInfo>>(TableCellEventTimestampComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {}
    } as EntityInfo;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
