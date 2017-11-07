import { IListDataSource } from '../../data-sources/list-data-source';
import { TableCellComponent } from '../table/table-cell/table-cell.component';
import { TableCellSelectComponent } from '../table/table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../table/table-header-select/table-header-select.component';
import { TableCellEditComponent } from '../table/table-cell-edit/table-cell-edit.component';
import {
  TableCellEditVariableComponent,
} from '../table/custom-cells/table-cell-edit-variable/table-cell-edit-variable.component';
import {
  TableCellEventTimestampComponent,
} from '../table/custom-cells/table-cell-event-timestamp/table-cell-event-timestamp.component';
import { TableCellEventTypeComponent } from '../table/custom-cells/table-cell-event-type/table-cell-event-type.component';
import {
  TableCellEventActionComponent,
} from '../table/custom-cells/table-cell-event-action/table-cell-event-action.component';
import {
  TableCellEventDetailComponent,
} from '../table/custom-cells/table-cell-event-detail/table-cell-event-detail.component';
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
import { CardEventComponent } from '../cards/custom-cards/card-app-event/card-app-event.component';
import { CardAppVariableComponent } from '../cards/custom-cards/card-app-variable/card-app-variable.component';
import { async } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../store/reducers.module';
import { getInitialTestStoreState } from '../../../test-framework/store-test-helper';
import { Observable } from 'rxjs/Observable';
import { ListPagination, ListFilter, ListSort } from '../../../store/actions/list.actions';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ListComponent', () => {
  let component: ListComponent<EntityInfo>;
  let fixture: ComponentFixture<ListComponent<EntityInfo>>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ListComponent,
        CardsComponent,
        CardComponent,
        CardEventComponent,
        CardAppVariableComponent,
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
        TableComponent
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
    } as IListDataSource<EntityInfo>;
    component.columns = [];
    component.paginator.pageSizeOptions = [];
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
