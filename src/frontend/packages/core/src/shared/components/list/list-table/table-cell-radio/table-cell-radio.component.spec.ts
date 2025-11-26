import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import type { APIResource } from '@stratosui/store';
import { CoreModule } from '../../../../../core/core.module';
import type { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { TableCellRadioComponent } from './table-cell-radio.component';

describe('TableCellRadioComponent', () => {
  let component: TableCellRadioComponent<unknown>;
  let fixture: ComponentFixture<TableCellRadioComponent<unknown>>;

  beforeEach(() => {
    TestBed.configureTestingModule({

      imports: [
      CoreModule,
      TableCellRadioComponent,
    ],
      providers: [provideZonelessChangeDetection()]

  }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellRadioComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        metadata: {}
      }
    } as APIResource;
    component.dataSource = {
      selectedRows: () => new Map(),
      getRowUniqueId: (row: unknown) => ''
    } as unknown as IListDataSource<unknown>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
