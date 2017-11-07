// import { NoopAnimationsModule } from '@angular/platform-browser/animations/public_api';
import { BehaviorSubject, Observable } from 'rxjs/Rx';
import { Map } from 'rxjs/util/Map';
import { ChangeDetectorRef } from '@angular/core/src/change_detection/change_detector_ref';
import { ListState } from '../../../store/reducers/list.reducer';
import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { ListFilter, ListPagination, ListSort, ListView } from '../../../store/actions/list.actions';
import { AppEnvVar } from '../../data-sources/cf-app-variables-data-source';
import { TableCellComponent } from './table-cell/table-cell.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableComponent, ITableColumn } from './table.component';
import { CoreModule } from '../../../core/core.module';
import { TableCellSelectComponent } from './table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from './table-header-select/table-header-select.component';
import { TableCellEditComponent } from './table-cell-edit/table-cell-edit.component';
import { TableCellEditVariableComponent } from './custom-cells/table-cell-edit-variable/table-cell-edit-variable.component';
import { MdPaginator, MdSort, MdPaginatorIntl } from '@angular/material';
import { TableCellEventTimestampComponent } from './custom-cells/table-cell-event-timestamp/table-cell-event-timestamp.component';
import { TableCellEventTypeComponent } from './custom-cells/table-cell-event-type/table-cell-event-type.component';
import { TableCellEventActionComponent } from './custom-cells/table-cell-event-action/table-cell-event-action.component';
import { TableCellEventDetailComponent } from './custom-cells/table-cell-event-detail/table-cell-event-detail.component';
import { EventTabActorIconPipe } from './custom-cells/table-cell-event-action/event-tab-actor-icon.pipe';
import { ValuesPipe } from '../../pipes/values.pipe';
import { IListDataSource } from '../../data-sources/list-data-source';
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
        TableCellEventTimestampComponent,
        TableCellEventTypeComponent,
        TableCellEventActionComponent,
        TableCellEventDetailComponent,
        EventTabActorIconPipe,
        ValuesPipe,
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
      selectedRows: new Map(),
      mdPaginator: new MdPaginator(mdPaginatorIntl, {} as ChangeDetectorRef),
      listStateKey: 'listKey',
      view$: Observable.of('table' as ListView),
      state$: Observable.of({} as ListState),
      pagination$: Observable.of({} as ListPagination),
      sort$: Observable.of({} as ListSort),
      filter$: Observable.of({} as ListFilter),
      page$: Observable.of(new Array<AppEnvVar>()),
      addItem: null,
      isAdding$: new BehaviorSubject(false),
      isSelecting$: new BehaviorSubject(false),
      editRow: null,
      selectAllChecked: false,
      selectAllFilteredRows: () => { },
      selectedRowToggle: (row: AppEnvVar) => { },
      startEdit: (row: AppEnvVar) => { },
      saveEdit: () => { },
      cancelEdit: () => { },
      destroy: () => { }
    } as IListDataSource<AppEnvVar>;
    // component.dataSource.selectedRows = new Map<string, AppEnvVar>();

    component.columns = new Array<ITableColumn<any>>();

    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
