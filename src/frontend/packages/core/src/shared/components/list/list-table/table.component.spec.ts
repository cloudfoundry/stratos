import { CdkTableModule } from '@angular/cdk/table';
import {  Component, ViewChild, provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EMPTY, of as observableOf } from 'rxjs';

import type { IListPaginationController } from '@stratosui/core';
import type { ListSort } from '@stratosui/store';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { TableComponent } from './table.component';

describe('TableComponent', () => {

  const column1Id = '123123';
  const column2Id = 'dsftq34ge';
  const column3Id = 'egsdnyyyydnygvvv';
  const columns = [
    {
      columnId: column1Id,
      headerCell: () => 'Header 1'
    },
    {
      columnId: column2Id,
      headerCell: () => 'Header 1'
    },
    {
      columnId: column3Id,
      headerCell: () => 'Header 1'
    }
  ];
  @Component({
    standalone: false,
    selector: `app-host-component`,
    template: `
    <app-table
      #basicColumnsTable
      [columns]="columns"
      [paginationController]="paginationController"
      [dataSource]="dataSource"
    >
    </app-table>
    ----------------------------------------
    <app-table
      #selectionColumnsTable
      [columns]="columns"
      [paginationController]="paginationController"
      [dataSource]="dataSource"
      [addSelect]="true"
    >
    </app-table>
    ----------------------------------------
    <app-table
      #actionColumnsTable
      [columns]="columns"
      [paginationController]="paginationController"
      [dataSource]="dataSource"
      [addActions]="true"
    >
    </app-table>
    ----------------------------------------
    <app-table
      #actionAndSelectionColumnsTable
      [columns]="columns"
      [paginationController]="paginationController"
      [dataSource]="dataSource"
      [addActions]="true"
      [addSelect]="true"
    >
    </app-table>
    `
  })
  class TableHostComponent {
    public addSelect = false;
    public columns = columns;
    // new Array<ITableColumn<unknown>>();
    public paginationController = {
      sort$: observableOf({} as ListSort),
    } as IListPaginationController<unknown>;
    public dataSource = {
      trackBy: (_index: number, _item: unknown): string | number => '1',
      connect: () => EMPTY,
      disconnect: (): null => null,
      isTableLoading$: observableOf(false),
    };
    @ViewChild('basicColumnsTable', { static: true })
    public basicColumnsTable!: TableComponent<unknown>;
    @ViewChild('selectionColumnsTable', { static: true })
    public selectionColumnsTable!: TableComponent<unknown>;
    @ViewChild('actionColumnsTable', { static: true })
    public actionColumnsTable!: TableComponent<unknown>;
    @ViewChild('actionAndSelectionColumnsTable', { static: true })
    public actionAndSelectionColumnsTable!: TableComponent<unknown>;
  }
  let component: TableHostComponent;
  let fixture: ComponentFixture<TableHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CdkTableModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        TableComponent,
      ],
      declarations: [
        TableHostComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<TableHostComponent>(TableHostComponent);
    component = fixture.componentInstance;


    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should get base column ids', () => {
    const { basicColumnsTable } = component;
    expect(basicColumnsTable.columnNames).toEqual([column1Id, column2Id, column3Id]);
  });

  it('should get base column ids + selection', () => {
    const { selectionColumnsTable } = component;
    expect(selectionColumnsTable.columnNames).toEqual(['select', column1Id, column2Id, column3Id]);
  });

  it('should get base column ids + actions', () => {
    const { actionColumnsTable } = component;
    expect(actionColumnsTable.columnNames).toEqual([column1Id, column2Id, column3Id, 'actions']);
  });

  it('should get base column ids + actions + selection', () => {
    const { actionAndSelectionColumnsTable } = component;
    expect(actionAndSelectionColumnsTable.columnNames).toEqual(['select', column1Id, column2Id, column3Id, 'actions']);
  });
});
