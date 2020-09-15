import { CdkTableModule } from '@angular/cdk/table';
import { Component, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { EMPTY, of as observableOf } from 'rxjs';

import { ListSort } from '../../../../../../store/src/actions/list.actions';
import { CoreTestingModule } from '../../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../../core/core.module';
import { UtilsService } from '../../../../core/utils.service';
import { SharedModule } from '../../../shared.module';
import { IListPaginationController } from '../data-sources-controllers/list-pagination-controller';
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
    // new Array<ITableColumn<any>>();
    public paginationController = {
      sort$: observableOf({} as ListSort)
    } as IListPaginationController<any>;
    public dataSource = {
      trackBy: () => '1',
      connect: () => EMPTY,
      disconnect: () => null,
      isTableLoading$: observableOf(false)
    };
    @ViewChild('basicColumnsTable', { static: true })
    public basicColumnsTable: TableComponent<any>;
    @ViewChild('selectionColumnsTable', { static: true })
    public selectionColumnsTable: TableComponent<any>;
    @ViewChild('actionColumnsTable', { static: true })
    public actionColumnsTable: TableComponent<any>;
    @ViewChild('actionAndSelectionColumnsTable', { static: true })
    public actionAndSelectionColumnsTable: TableComponent<any>;
  }
  let component: TableHostComponent;
  let fixture: ComponentFixture<TableHostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        CdkTableModule,
        NoopAnimationsModule,
        CoreTestingModule,
        createBasicStoreModule(),
        SharedModule
      ],
      declarations: [
        TableHostComponent
      ],
      providers: [
        UtilsService,
      ]
    })
      .compileComponents();
  }));

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
