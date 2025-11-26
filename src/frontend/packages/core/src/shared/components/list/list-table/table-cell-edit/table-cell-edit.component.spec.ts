import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TableCellEditComponent } from './table-cell-edit.component';
import { CoreModule } from '../../../../../core/core.module';
import type { IListDataSource } from '../../data-sources-controllers/list-data-source-types';

describe('TableCellEditComponent', () => {
  let component: TableCellEditComponent<unknown>;
  let fixture: ComponentFixture<TableCellEditComponent<unknown>>;

  beforeEach(() => {
    TestBed.configureTestingModule({

      providers: [provideZonelessChangeDetection()],

      imports: [
        CoreModule,
        TableCellEditComponent,
      ]

    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEditComponent);
    component = fixture.componentInstance;
    component.row = {};
    component.dataSource = {} as IListDataSource<unknown>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
