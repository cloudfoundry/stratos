import { ValuesPipe } from '../../../pipes/values.pipe';
import { EventTabActorIconPipe } from '../custom-cells/table-cell-event-action/event-tab-actor-icon.pipe';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellComponent } from './table-cell.component';
import { TableCellSelectComponent } from '../table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../table-header-select/table-header-select.component';
import { TableCellEditComponent } from '../table-cell-edit/table-cell-edit.component';
import { TableCellEditVariableComponent } from '../custom-cells/table-cell-edit-variable/table-cell-edit-variable.component';
import { CoreModule } from '../../../../core/core.module';
import { TableCellEventTimestampComponent } from '../custom-cells/table-cell-event-timestamp/table-cell-event-timestamp.component';
import { TableCellEventTypeComponent } from '../custom-cells/table-cell-event-type/table-cell-event-type.component';
import { TableCellEventActionComponent } from '../custom-cells/table-cell-event-action/table-cell-event-action.component';
import { TableCellEventDetailComponent } from '../custom-cells/table-cell-event-detail/table-cell-event-detail.component';

describe('TableCellComponent', () => {
  let component: TableCellComponent<any>;
  let fixture: ComponentFixture<TableCellComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
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
    fixture = TestBed.createComponent(TableCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
