import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule } from '../../../../../core/core.module';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { TableCellSelectComponent } from './table-cell-select.component';
import { of as observableOf } from 'rxjs';

describe('TableCellSelectComponent', () => {
  let component: TableCellSelectComponent<any>;
  let fixture: ComponentFixture<TableCellSelectComponent<any>>;

  beforeEach(() => {
    TestBed.configureTestingModule({

      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ],

      imports: [
        CoreModule,
        TableCellSelectComponent,
      ]

    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellSelectComponent);
    component = fixture.componentInstance;
    component.row = {};
    component.rowState = observableOf({});
    component.dataSource = {
      selectedRows: () => new Map(),
      getRowUniqueId: (_row: any) => ''
    } as unknown as IListDataSource<any>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
