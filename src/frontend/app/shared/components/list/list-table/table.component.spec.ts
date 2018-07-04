import { CdkTableModule } from '@angular/cdk/table';
import { Component, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { empty, of as observableOf } from 'rxjs';

import { CoreModule } from '../../../../core/core.module';
import { UtilsService } from '../../../../core/utils.service';
import { ListSort } from '../../../../store/actions/list.actions';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { SharedModule } from '../../../shared.module';
import { IListPaginationController } from '../data-sources-controllers/list-pagination-controller';
import { ITableColumn } from './table.types';
import { TableComponent } from './table.component';

fdescribe('TableComponent', () => {

  function getTestHostComponent() {

  }
  const column1Id = '123123';
  const column2Id = 'dsftq34ge';
  const column3Id = 'egsdnyyyydnygvvv';
  @Component({
    selector: `app-host-component`,
    template: `
    <app-table
    [columns]="columns"
    [paginationController]="paginationController"
    [dataSource]="dataSource"
    [addSelect]="addSelect">
    </app-table>
    `
  })
  class TableHostComponent {
    public addSelect = false;
    public columns: ITableColumn<any>[] = [
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
    // new Array<ITableColumn<any>>();
    public paginationController = {
      sort$: observableOf({} as ListSort)
    } as IListPaginationController<any>;
    public dataSource = {
      trackBy: () => '1',
      connect: () => empty(),
      disconnect: () => null,
      isTableLoading$: observableOf(false)
    };
    @ViewChild(TableComponent)
    public table: TableComponent<any>;
    // @Input('hideTable') hideTable = false;
    // @Input('addSelect') addSelect = false;
    // @Input('addActions') addActions = false;
    // @Input('dataSource') dataSource: ITableListDataSource<T>;
    // @Input('paginationController') paginationController = null as IListPaginationController<T>;
    // @Input('columns') columns: ITableColumn<T>[];
  }
  let component: TableComponent<any>;
  let fixture: ComponentFixture<TableHostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        CdkTableModule,
        NoopAnimationsModule,
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
    component = fixture.componentInstance.table;


    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should get base column ids', () => {
    expect(component.columnNames).toEqual([column1Id, column2Id, column3Id]);
  });
});
