import { CoreModule } from '../../../../core/core.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardComponent } from './card.component';
import { EntityInfo } from '../../../../store/types/api.types';
import { CardEventComponent } from '../custom-cards/card-app-event/card-app-event.component';
import { CardAppVariableComponent } from '../custom-cards/card-app-variable/card-app-variable.component';
import { TableCellComponent } from '../../table/table-cell/table-cell.component';
import { TableCellSelectComponent } from '../../table/table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../../table/table-header-select/table-header-select.component';
import { TableCellEditComponent } from '../../table/table-cell-edit/table-cell-edit.component';
import { TableCellEditVariableComponent } from '../../table/custom-cells/table-cell-edit-variable/table-cell-edit-variable.component';
import { TableCellEventTimestampComponent } from '../../table/custom-cells/table-cell-event-timestamp/table-cell-event-timestamp.component';
import { TableCellEventTypeComponent } from '../../table/custom-cells/table-cell-event-type/table-cell-event-type.component';
import { TableCellEventActionComponent } from '../../table/custom-cells/table-cell-event-action/table-cell-event-action.component';
import { TableCellEventDetailComponent } from '../../table/custom-cells/table-cell-event-detail/table-cell-event-detail.component';
import { EventTabActorIconPipe } from '../../table/custom-cells/table-cell-event-action/event-tab-actor-icon.pipe';
import { ValuesPipe } from '../../../pipes/values.pipe';
import { getInitialTestStoreState } from '../../../../test-framework/store-test-helper';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../../store/reducers.module';

describe('CardComponent', () => {
  let component: CardComponent<EntityInfo>;
  let fixture: ComponentFixture<CardComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
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
      ],
      imports: [
        CoreModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
