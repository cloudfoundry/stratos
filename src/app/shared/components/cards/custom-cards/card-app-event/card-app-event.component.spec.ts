import { TableCellComponent } from '../../../table/table-cell/table-cell.component';
import { EventTabActorIconPipe } from '../../../table/custom-cells/table-cell-event-action/event-tab-actor-icon.pipe';
import { ValuesPipe } from '../../../../pipes/values.pipe';
 
import { CoreModule } from '../../../../../core/core.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CardEventComponent } from './card-app-event.component';
import { EntityInfo } from '../../../../../store/types/api.types';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../../../store/reducers.module';
import { TableCellEntryPoints } from '../../../../../test-framework/list-table-helper';


describe('CardEventComponent', () => {
  let component: CardEventComponent;
  let fixture: ComponentFixture<CardEventComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardEventComponent,
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
    fixture = TestBed.createComponent(CardEventComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        type: ''
      }

    } as EntityInfo;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
