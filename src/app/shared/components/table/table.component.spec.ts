import { ITableDataSource } from '../../data-sources/table-data-source';
import { TableCellComponent } from './table-cell/table-cell.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableComponent, TableColumn } from './table.component';
import { CoreModule } from '../../../core/core.module';
import { TableCellSelectComponent } from './table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from './table-header-select/table-header-select.component';
import { TableCellEditComponent } from './table-cell-edit/table-cell-edit.component';
import { TableCellEditVariableComponent } from './custom-cells/table-cell-edit-variable/table-cell-edit-variable.component';
import { MdPaginator, MdSort, MdPaginatorIntl } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { ChangeDetectorRef } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('TableComponent', () => {
  let component: TableComponent<any>;
  let fixture: ComponentFixture<TableComponent<any>>;



  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableComponent,
        TableCellComponent,
        TableCellSelectComponent,
        TableHeaderSelectComponent,
        TableCellEditComponent,
        TableCellEditVariableComponent,
      ],
      imports: [
        CoreModule,
        NoopAnimationsModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;

    const mdPaginatorIntl: MdPaginatorIntl = new MdPaginatorIntl();
    component.dataSource = {
      connect() { return Observable.of([]); },
      initialise(paginator: MdPaginator, sort: MdSort, filter$: Observable<string>) { },
      selectedRows: new Map<string, any>(),
      mdPaginator: new MdPaginator(mdPaginatorIntl, {} as ChangeDetectorRef)
    } as ITableDataSource<any>;
    component.dataSource.selectedRows = new Map<string, any>();

    component.columns = new Array<TableColumn<any>>();

    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
