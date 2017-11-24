import { IListDataSource, ListActions } from '../../data-sources/list-data-source';
import { TableCellComponent } from '../table/table-cell/table-cell.component';
import { EventTabActorIconPipe } from '../table/custom-cells/table-cell-event-action/event-tab-actor-icon.pipe';
import { ValuesPipe } from '../../pipes/values.pipe';
import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { CardComponent } from '../cards/card/card.component';
import { TableComponent } from '../table/table.component';
import { EntityInfo } from '../../../store/types/api.types';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListComponent } from './list.component';
import { CoreModule } from '../../../core/core.module';
import { CardsComponent } from '../cards/cards.component';
import { async } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../store/reducers.module';
import { getInitialTestStoreState } from '../../../test-framework/store-test-helper';
import { Observable } from 'rxjs/Observable';
import { ListPagination, ListFilter, ListSort } from '../../../store/actions/list.actions';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TableCellActionsComponent } from '../table/table-cell-actions/table-cell-actions.component';
import { CardAppComponent } from '../cards/custom-cards/card-app/card-app.component';
import { TableCellAppNameComponent } from '../table/custom-cells/table-cell-app-name/table-cell-app-name.component';
import { TableCellEntryPoints, CardEntryPoints } from '../../../test-framework/list-table-helper';

describe('ListComponent', () => {
  let component: ListComponent<EntityInfo>;
  let fixture: ComponentFixture<ListComponent<EntityInfo>>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ...TableCellEntryPoints,
        ...CardEntryPoints,
        ListComponent,
        CardsComponent,
        CardComponent,
        TableCellComponent,
        EventTabActorIconPipe,
        ValuesPipe,
        TableComponent,
      ],
      imports: [
        CoreModule,
        StoreModule.forRoot(appReducers,
          {
            initialState
          }),
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    component.dataSource = {
      connect: () => { },
      pagination$: Observable.of({} as ListPagination),
      filter$: Observable.of({} as ListFilter),
      sort$: Observable.of({} as ListSort),
      selectedRows: {},
      actions: new ListActions<any>(),
    } as IListDataSource<EntityInfo>;
    component.columns = [];
    component.paginator.pageSizeOptions = [];
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
