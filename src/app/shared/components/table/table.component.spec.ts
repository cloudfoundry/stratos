import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatPaginatorIntl } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable } from 'rxjs/Rx';

import { CoreModule } from '../../../core/core.module';
import { ListSort } from '../../../store/actions/list.actions';
import { TableCellEntryPoints } from '../../../test-framework/list-table-helper';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { AppEnvVar } from '../../data-sources/cf-app-variables-data-source';
import { IListDataSource } from '../../data-sources/list-data-source-types';
import { ValuesPipe } from '../../pipes/values.pipe';
import { EventTabActorIconPipe } from './custom-cells/table-cell-event-action/event-tab-actor-icon.pipe';
import { TableCellComponent } from './table-cell/table-cell.component';
import { TableComponent } from './table.component';
import { ITableColumn } from './table.types';


describe('TableComponent', () => {
  let component: TableComponent<AppEnvVar>;
  let fixture: ComponentFixture<TableComponent<AppEnvVar>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ...TableCellEntryPoints,
        TableComponent,
        TableCellComponent,
        EventTabActorIconPipe,
        ValuesPipe,
      ],
      imports: [
        CoreModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;

    const mdPaginatorIntl: MatPaginatorIntl = new MatPaginatorIntl();
    component.dataSource = {
      connect() { return Observable.of([]); },
      sort$: Observable.of({} as ListSort),
    } as IListDataSource<AppEnvVar>;
    component.columns = new Array<ITableColumn<any>>();

    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
