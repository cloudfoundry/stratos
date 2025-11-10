import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { APIResource } from '@stratosui/store';

import { TableCellEventActeeComponent } from './table-cell-event-actee.component';

describe('TableCellEventActeeComponent', () => {
  let component: TableCellEventActeeComponent;
  let fixture: ComponentFixture<TableCellEventActeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCellEventActeeComponent],
      providers: [provideZonelessChangeDetection()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellEventActeeComponent);
    component = fixture.componentInstance;
    component.row = { entity: {}, metadata: {} } as APIResource;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
