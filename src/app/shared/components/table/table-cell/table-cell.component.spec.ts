import { ApplicationStateComponent } from '../../application-state/application-state.component';
import {
    ApplicationStateIconComponent,
} from '../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateService } from '../../application-state/application-state.service';
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
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
      ],
      imports: [
        CoreModule,
      ],
      providers: [
        ApplicationStateService,
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
