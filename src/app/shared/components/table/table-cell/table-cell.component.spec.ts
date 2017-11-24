import { TableCellComponent } from './table-cell.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TableCellEntryPoints } from '../../../../test-framework/list-table-helper';
import { EventTabActorIconPipe } from '../custom-cells/table-cell-event-action/event-tab-actor-icon.pipe';
import { ValuesPipe } from '../../../pipes/values.pipe';
import { CoreModule } from '../../../../core/core.module';


describe('TableCellComponent', () => {
  let component: TableCellComponent<any>;
  let fixture: ComponentFixture<TableCellComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellComponent,
        ...TableCellEntryPoints,
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
